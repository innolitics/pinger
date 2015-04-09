var orm = require('orm');

exports.defineModels = function defineModels(db, models) {

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

};
