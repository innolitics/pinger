var Test = function() {
  return m.request({method: 'GET', url: '/api/tests/'});
};

var pinger = {
  controller: function() {
    var tests = Test();
    return {
      tests: tests,
    };
  },

  view: function(ctrl) {
    return m("div", [
      m('h1', 'Pinger'),
      m('ul', _.map(ctrl.tests(), function(test) {
        return m('li', test.name);
      })),
    ]);
  }
};

m.route(document.body, "/", {
  "/": pinger,
});
