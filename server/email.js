var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('BH9_1AHvZI4Jc-coB_bCaw');


var async = false;
var ip_pool = "Main Pool";
var send_at = "example send_at";


exports.errorEmail = function(siteUrl, result) {
  var message = {
    text: "Site " + siteUrl + " down\nstatus code: " + result.status,
    subject: "SITE " + siteUrl + " DOWN",
    from_email: "info@innolitics.com",
    from_name: "Pinger",
    to: [{
            "email": "jdgiese@innolitics.com",
            "name": "John David Giese",
            "type": "to"
    }],
  };

  mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
    console.log(result);
  }, function(e) {
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
  });
};


