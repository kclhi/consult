'use strict';
module.exports = function(sequelize, DataTypes) {

  var users = sequelize.define('users', {

    id: {
     primaryKey: true,
     type: DataTypes.STRING
    },
    token: {
     primaryKey: true,
     type: DataTypes.STRING
    },
    secret: DataTypes.STRING,
    refresh: DataTypes.STRING

  });

  return users;

};
