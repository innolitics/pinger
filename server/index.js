var http = require('http');
var https = require('https');
require('ssl-root-cas/latest').inject();

var bodyParser = require('body-parser');
var orm = require('orm');
var _ = require('underscore');
var Q = require('q');
var io = require('socket.io');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var email = require('./email');


app.use(bodyParser.json());

app.use(express.static(__dirname + '/../client/'));
io.on('connection', function(socket){
  console.log('a user connected');
});

server.listen(8000);

app.use(orm.express({host: "./pinger.db", protocol: "sqlite"}, {
  define: function (db, models) {
    models.Test = db.define("test", {
      url: {type: "text", required: true},
      name: {type: "text", required: true},
      email: {type: "text", required: true},
      active: {type: "boolean", required: true},
    }, {
      validations: {
        email: orm.validators.patterns.email("Must be an email"),
      }
    });

    models.Result = db.define("result", {
      when: {type: "date", required: true},
      status: {type: "number", required: true},
      time: {type: "number", required: true},
    });
    models.Result.hasOne("test", models.Test, {required: true, reverse: 'results'});

    var pingUrl = function(){
      models.Test.find(function(err, tests) {
      if (err === null) {

        var activeTests = _.filter(tests, function(t) { return t.active; });
        _.each(activeTests, function(test) {
          console.log("making request for %s", test.url);
          var timeStart = Date.now();

          var protocol;
          if (test.url.slice(0, 5).toLowerCase() === "https") {
            protocol = https;
          } else if (test.url.slice(0, 4).toLowerCase() === "http") {
            protocol = http;
          } else {
            return;
          }

          // TODO: email us if there are any errors that occur
          // TODO: if an email has already been sent, don't send another email
          // for a period of time (to avoid annoyance, and to avoid using up
          // our mandrill quota)
          protocol.get(test.url, function(res) {
            models.Result.create({
              test_id: test.id,
              status: res.statusCode,
              time: Date.now() - timeStart,
              when: new Date(),
            }, function(err, result) {
              if (err === null) {
                if (result.status >= 500) {
                  email.errorEmail(test.url, result);
                }
                io.emit('newResult', {result: result});
                console.log("saved");
              } else {
                console.log(err);
              }
            });
          })
          .on('error', function(err) {
            console.log(err);
          });

        });
      } else {
        console.log("Error: failed to load tests");
      }});}

    setInterval(pingUrl, 5000);


    db.sync(function(err) {});
  }
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

