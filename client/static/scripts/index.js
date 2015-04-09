var socket = io();

var pinger = {};

pinger.getTests = function() {
  return m.request({method: 'GET', url: '/api/tests/'});
};

pinger.vm = (function() {
    vm = {};

    vm.newTest = {
      url: m.prop(''),
      name: m.prop(''),
      email: m.prop(''),
    };

    
    vm.createNewTest = function() {
      m.request({method: 'POST', url: '/api/tests/', data: {
        url: vm.newTest.url(),
        name: vm.newTest.name(),
        email: vm.newTest.email(),
      }})
      .then(function(response) {
        console.log(response);
        vm.addTest(response);
        vm.newTest.url('');
        vm.newTest.name('');
        vm.newTest.email('');
      });
    };


    vm.init = function() {

        pinger.getTests()
        .then(function(tests){
            vm.tests = _.map(tests, vm.addTest);

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

    vm.addTest = function(test){
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
    return m("#pinger-app", [
      m('h1', 'Pinger'),
      m('form.form-inline', [
        m('input.form-control[placeholder=url][required][type=url]', {oninput: m.withAttr('value', vm.newTest.url), value: vm.newTest.url()}),
        m('input.form-control[placeholder=name][required]', {oninput: m.withAttr('value', vm.newTest.name), value: vm.newTest.name()}),
        m('input.form-control[placeholder=email][required][type=email]', {oninput: m.withAttr('value', vm.newTest.email), value: vm.newTest.email()}),
        m('button.btn', {onclick: vm.createNewTest}, 'Add Test'),
      ]),
      m('table.table', [
        m('thead', 
          m('tr', [
            m('th', 'URL'),
            m('th', 'Status'),
            m('th', 'Time (ms)')
          ])
        ),
        m('tbody', 
          _.map(pinger.vm.tests, function(test) {
          var latestPingTime = _.last(test.pingTimes);
          var latestStatus = _.last(test.status);
          return m('tr', [
              m('td', test.url),
              m('td', latestStatus),
              m('td', latestPingTime),
          ]);
        }))
      ])
    ]);
};



m.route(document.body, "/", {
  "/": {controller: pinger.controller, view: pinger.view}
});
