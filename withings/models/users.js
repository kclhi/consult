'use strict';
module.exports = function(sequelize, DataTypes) {
  var users = sequelize.define('users', {
    patientID: {
      primaryKey: true,
      type: DataTypes.STRING
    },
    nokiaID: {
      primaryKey: false,
      type: DataTypes.INTEGER
    },
    token: DataTypes.STRING,
    secret: DataTypes.STRING,
    refresh: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return users;
};
