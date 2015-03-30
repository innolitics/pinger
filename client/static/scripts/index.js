var socket = io();

var pinger = {};

pinger.getTests = function() {
  return m.request({method: 'GET', url: '/api/tests/'});
};

pinger.vm = (function() {
    vm = {};

    vm.init = function() {
        pinger.getTests()
        .then(function(tests){
            vm.tests = _.map(tests, function(test){
                test.status = _.pluck(test.results, 'status');
                test.pingTimes = _.pluck(test.results, 'time');
                return test;
            });

            socket.on('newResult', function (data) {
                m.startComputation();
                try {
                    vm.addResult(data.result);
                } catch (e) {
                    alert('There is a problem:', e);
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


    return vm;
}());

pinger.controller = function() {
    pinger.vm.init();
};

pinger.view = function() {
    var expanded_test = 3;
    return m("#pinger-app", [
      m('h1', 'Pinger'),
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
