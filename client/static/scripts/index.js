var socket = io();

var pinger = {};

pinger.getTests = function() {
  return m.request({method: 'GET', url: '/api/tests/'});
};

pinger.vm = (function() {
    vm = {};

    vm.newTest = {
      url: m.prop(''),
      email: m.prop(''),
    };

    
    vm.createNewTest = function() {
      m.request({method: 'POST', url: '/api/tests/', data: {
        url: vm.newTest.url(),
        email: vm.newTest.email(),
        active: true,
      }})
      .then(function(test) {
        vm.tests.push(vm.parseTest(test));
        vm.newTest.url('');
        vm.newTest.email('');
      });
    };


    vm.toggleTest = function(test) {
      m.request({method: 'PUT', url: '/api/tests/' + test.id + '/toggle/'})
      .then(function() {
        test.active = !test.active;
      });
    };


    vm.init = function() {

        pinger.getTests()
        .then(function(tests){
            vm.tests = _.map(tests, vm.parseTest);

            socket.on('newResult', function (data) {
                m.startComputation();
                try {
                    vm.addResult(data.result);
                } catch (e) {
                    console.log('There is a problem:', e);
                } finally {
                    m.endComputation();
                }
            });
        });
    };

    vm.addResult = function(result) {
        testIndex = _.pluck(vm.tests, 'id').indexOf(result.test_id);
        vm.tests[testIndex].pingTimes.push(result.time);
        vm.tests[testIndex].status.push(result.status);
    };

    vm.parseTest = function(test){
      console.log(test);
        test.status = _.pluck(test.results, 'status');
        test.pingTimes = _.pluck(test.results, 'time');
        return test;
    };

    return vm;
}());

pinger.controller = function() {
    pinger.vm.init();
};

pinger.view = function() {
    return m("#pinger-app.container", [
      m('h1', 'Pinger'),
      m('br'),
      m('form', split3([
        m('input.form-control[placeholder=url][required][type=url]', {oninput: m.withAttr('value', vm.newTest.url), value: vm.newTest.url()}),
        m('input.form-control[placeholder=email][required][type=email]', {oninput: m.withAttr('value', vm.newTest.email), value: vm.newTest.email()}),
        m('button.btn.btn-block[type=button]', {onclick: vm.createNewTest}, 'Add Test'),
      ])),
      m('br'),
      m('table.table', [
        m('thead', 
          m('tr', [
            m('th', 'URL'),
            m('th', 'Email'),
            m('th', 'Status'),
            m('th', 'Time (ms)'),
            m('th', 'Toggle'),
          ])
        ),
        m('tbody', 
          _.map(pinger.vm.tests, function(test) {
          var latestPingTime = _.last(test.pingTimes);
          var latestStatus = _.last(test.status);
          return m('tr', [
              m('td', test.url),
              m('td', test.email),
              m('td', latestStatus),
              m('td', latestPingTime),
              m('td', [
                m('button.btn', {
                  'onclick': function() { vm.toggleTest(test); },
                  'class': test.active ? 'btn-default' : 'btn-primary',
                }, test.active ? 'Disable' : 'Enable')
              ])
          ]);
        }))
      ])
    ]);
};



m.route(document.body, "/", {
  "/": {controller: pinger.controller, view: pinger.view}
});


function split3(nodes) {
  return m('.row', _.map(nodes, function(n) {
    return m('.col-xs-12.col-sm-4', [n]);
  }));
}

