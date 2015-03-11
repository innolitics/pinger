var socket = io();

var pinger = {};

pinger.getTests = function() {
  return m.request({method: 'GET', url: '/api/tests/'});
};

pinger.vm = (function() {
    vm = {};
    vm.init = function() {
        pinger.getTests()
            .then(function(data){
                vm.tests = data;
                vm.listen = (function () {
                    m.startComputation();
                    socket.on('newResult', function (data) {
                        try {
                            testIndex = _.map(vm.tests, function(test){
                                return test.id;
                            }).indexOf(data.result.test_id);
                            vm.tests[testIndex].results.push(data.result);
                        } catch (e) {
                            alert('There is a problem:', e);
                        } finally {
                            m.endComputation();
                        }
                    });
                }) ();
            });


    };
    return vm;
}());

pinger.controller = function() {
    pinger.vm.init();
};

pinger.view = function() {
    return m("div.container", [
      m('h1', 'Pinger'),
      m('table.table', _.map(pinger.vm.tests, function(test) {
        return [m('table-head', test.url),
            m('td', _.map(test.results, function(result){
                return m('tr', result.when);
            }))
        ];
      }))
    ]);
};



m.route(document.body, "/", {
  "/": {controller: pinger.controller, view: pinger.view}
});
