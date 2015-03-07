var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var orm = require('orm');
var _ = require('underscore');

var app = express();

app.use(bodyParser.json());

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
    models.Result.hasOne("test", models.Test, {required: true});


    setInterval(function(){
      models.Test.find(function(err, tests) {
      if (err === null) {
          _.each(tests, function(test) {
            timeStart = Date.now();
            http.get(test.url, function(res) {
              models.Result.create({
                test_id: test.id,
                status: res.status(),
                time: Date.now() - timeStart,
              });
            })
            .on('error', function(err) {
              console.log(err);
            });
          });
      }
      else {
        console.log("Error: failed to load tests");
      }});
    }, 5000);


    db.sync(function(err) {});
  }
}));

app.listen(8000);

app.get("/api/tests/", function (req, res) {
   req.models.Test.find(function(err, tests) {
     if (err === null) {
       res.json(tests);
     } else {
       res.status(500).end();
     }
   });
});


app.post("/api/tests/", function (req, res) {
   req.models.Test.create([req.body], function(err, tests) {
     if (err === null) {
       res.status(201).json(tests[0]);
     } else {
       res.status(400).end();
     }
   });
});
