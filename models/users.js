'use strict';
module.exports = function(sequelize, DataTypes) {
  var users = sequelize.define('users', {
    nhsNumber: {
      type: DataTypes.STRING
    },
    patientID: {
      type: DataTypes.STRING
    },
    token: {
      primaryKey: true,
      type: DataTypes.STRING
    }
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return users;
};
