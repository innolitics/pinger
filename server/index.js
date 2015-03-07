var express = require('express');
var bodyParser = require('body-parser');
var orm = require('orm');

var app = express();

app.use(bodyParser.json());

app.use(orm.express({host: "./pinger.db", protocol: "sqlite"}, {
  define: function (db, models) {
    models.test = db.define("test", {
      url: String,
      name: String,
      email: String,
      active: Boolean,
    });

    models.test.hasMany("results", {
      when: Date,
      status: Number,
      time: Number,
    }, {
      autoFetch: true,
      autoFetchLimit: 100,
    });

    db.sync(function(err) {
      !err && console.log("done");
    });
  }
}));

app.listen(8000);

app.get("/api/tests/", function (req, res) {
   req.models.test.find(function(err, tests) {
     if (err === null) {
       res.json(tests);
     } else {
       res.status(500).end();
     }
   });
});


app.post("/api/tests/", function (req, res) {
   req.models.test.create([req.body], function(err, tests) {
     if (err === null) {
       res.status(201).json(tests[0]);
     } else {
       res.status(400).end();
     }
   });
});
