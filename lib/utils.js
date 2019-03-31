const request = require('request');
const fs = require('fs');
const config = require('config');
const logger = require('../config/winston');

class Utils {

  // Does the item at the end of the path specified exist? If so, return it.
  static validPath(object, path) {

    if (!object) return false;

    for (var child in path) {

      if ( object[path[child]] ) {

        object = object[path[child]];

      } else {

        logger.error("Valid path check error. " + path[child] + " not in " + JSON.stringify(object));
        return false

      }

    }

    return object;

  }

  static noParse(target, path, object) {

    var pathInfo = "";
    if ( path.length > 0 ) pathInfo =  path.toString() + " not a valid path in ";
    logger.error("Could not parse " + target + ". " + pathInfo + ( typeof object === "object" ? JSON.stringify(object) : object))

  }

  static JSONParseWrapper(string) {

    var parsed;

    try {

      parsed = JSON.parse(string);

    } catch(e) {

      logger.error("Could not parse: " + string);
      return false;

    }

    return parsed;

  }

}

module.exports = Utils;
