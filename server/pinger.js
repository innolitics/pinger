var http = require('http');
var https = require('https');
require('ssl-root-cas/latest').inject();

var _ = require('underscore');

var email = require('./email');


// keep track of when the last time we sent an email for a given test
var lastEmailSentCache = {};

var delayBetweenEmailsMS = 1000*60*30;


exports.ping = function(models, io) {
  models.Test.find(function(err, tests) {
    if (err !== null) {
      console.log("Error: failed to load tests");
    } else {

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
        protocol.get(test.url, function(res) {
          models.Result.create({
            test_id: test.id,
            status: res.statusCode,
            time: Date.now() - timeStart,
            when: new Date(),
          }, function(err, result) {
            if (err === null) {
              if (result.status >= 500) {
                var lastEmailSentOn = lastEmailSentCache[test.id];
                var longEnoughDelayBetweenEmails = true;

                if (lastEmailSentOn !== undefined) {
                  longEnoughDelayBetweenEmails = (new Date() - lastEmailSentOn) > delayBetweenEmailsMS;
                }

                if (longEnoughDelayBetweenEmails) {
                  email.errorEmail(test.url, result);
                }

                lastEmailSentCache[test.id] = new Date();
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
    }
  });
}
