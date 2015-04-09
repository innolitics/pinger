var bodyParser = require('body-parser');
var orm = require('orm');
var _ = require('underscore');
var Q = require('q');
var io = require('socket.io');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var definitions = require('./definitions');
var pinger = require('./pinger');


app.use(bodyParser.json());

app.use(express.static(__dirname + '/../client/'));
io.on('connection', function(socket){
  console.log('a user connected');
});

server.listen(8000);

app.use(orm.express({host: "./pinger.db", protocol: "sqlite"}, {
  define: function(db, models, next) {

    definitions.defineModels(db, models);

    // ping all the sites every second
    setInterval(function() {
      pinger.ping(models, io);
    }, 5000);

    next();
  },
}));


app.get("/api/tests/:testId/results/", function(req, res) {
  var testId = parseInt(req.params['testId']);
  req.models.Test.get(testId, function(err, test){
     if (err === null){
       test.getResults(function(err, results) {
         if (err === null) {
           res.json(results);
         } else {
           res.status(500).end();
         }
       });
     } else {
       res.status(404).end();
     }

  });
});


app.get("/api/tests/", function (req, res) {
   req.models.Test.find(function(err, tests) {
     if (err === null) {
       Q.all(_.map(tests, function(test) {
         var deferred = Q.defer();
         test.getResults(function(err, results) {
           if (err === null) {
             test.results = results;
             deferred.resolve();
           } else {
             deferred.reject(err);
           }
         });
         return deferred.promise;
       }))
       .then(function() {
         res.json(tests);
       });
     } else {
       res.status(500).end();
     }
   });
});


app.post("/api/tests/", function (req, res) {
  // TODO: inform people over the socket that a test was added
   req.models.Test.create([req.body], function(err, tests) {
     if (err === null) {
       res.status(201).json(tests[0]);
     } else {
       res.status(400).end();
     }
   });
});


app.put("/api/tests/:testId/toggle/", function (req, res) {
  // TODO: inform people over the socket that a test was changed
  var testId = parseInt(req.params['testId']);
   req.models.Test.get(testId, function(err, test) {
     if (err === null) {
       test.active = !test.active;
       test.save(function(err) {
         if (err === null) {
           res.status(200).end();
         } else {
           res.status(500).end();
         }
       })
     } else {
       res.status(404).end();
     }
   });
});

