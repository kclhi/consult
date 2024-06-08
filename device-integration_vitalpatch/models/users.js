'use strict';
module.exports = function(sequelize, DataTypes) {
  var users = sequelize.define('users', {
    patientId: {
      primaryKey: true,
      type: DataTypes.STRING
    },
    patchId: {
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
