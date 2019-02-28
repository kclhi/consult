const request = require('request');
const config = require('../lib/config.js');

class Util {

  static replaceAll(str, find, replace) {

    return str.replace(new RegExp(find, 'g'), replace);

  }

}

module.exports = Util;
