var pinger = {};

pinger.getTests = function() {
  return m.request({method: 'GET', url: '/api/tests/'});
};

pinger.vm = (function() {
    vm = {};
    vm.init = function() {
        vm.tests =  pinger.getTests();
    };
    return vm;
}());

pinger.controller = function() {
    pinger.vm.init();
};

pinger.view = function() {
    return m("div", [
      m('h1', 'Pinger'),
      m('ul', _.map(pinger.vm.tests(), function(test) {
        return m('li', test.name);
      }))
    ]);
};



m.route(document.body, "/", {
  "/": {controller: pinger.controller, view: pinger.view}
});
