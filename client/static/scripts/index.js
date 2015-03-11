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
                    test.isUp = _.map(test.results, function(result){
                        return result.status === 200;
                    });
                    test.pingTimes = _.map(test.results, function(result){
                        return result.time;
                    });
                    return test;
                });
                vm.listen = (function () {
                    m.startComputation();
                    socket.on('newResult', function (data) {
                        try {
                            vm.addResult(data.result);
                        } catch (e) {
                            alert('There is a problem:', e);
                        } finally {
                            m.endComputation();
                        }
                    });
                }) ();
            });

        vm.addResult = function(result){
            testIndex = _.map(vm.tests, function(test){
                return test.id;
            }).indexOf(result.test_id);
            vm.tests[testIndex].results.push(result);
            vm.tests[testIndex].pingTimes.push(result.time);
            vm.tests[testIndex].isUp.push(result.status === 200);
        };

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
      m('table.table', _.map(pinger.vm.tests, function(test) {
        return [m('table-head', test.url),
            m('td', _.map(test.results, function(result){
                if (expanded_test === test.id){
                    return m('tr', result.when);
                }
            }))
        ];
      }))
    ]);
};



m.route(document.body, "/", {
  "/": {controller: pinger.controller, view: pinger.view}
});
