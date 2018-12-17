'use strict';
module.exports = function(sequelize, DataTypes) {

  var users = sequelize.define('users', {

      id: {
       primaryKey: true,
       type: DataTypes.INTEGER
      },
      token: DataTypes.STRING,
      secret: DataTypes.STRING,
      refresh: DataTypes.STRING

  });

  return users;

};
