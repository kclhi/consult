const logger = require('../config/winston');

class Util {

  static replaceAll(str, find, replace) {

    return str.replace(new RegExp(find, 'g'), replace);

  }

  static JSONParseWrapper(string) {

		if (!string) return false;

    var parsed;

    try {

      parsed = JSON.parse(string);

    } catch(e) {

      logger.error("Could not parse: " + ( typeof string === "object" ? JSON.stringify(string) : string ) + ": " + e);
      return false;

    }

    return parsed;

  }

	// Does the item at the end of the path specified exist? If so, return it.
  static validPath(object, path) {

    if (!object) return false;

    for (var child in path) {

      if ( object[path[child]] ) {

        object = object[path[child]];

      } else {

        logger.error("Valid path check error. " + path[child] + " not in " + JSON.stringify(object).substring(0, 300));
        return false

      }

    }

    return object;

  }

	static noParse(target, path, object) {

    var pathInfo = "";
    if ( path.length > 0 ) pathInfo =  path.toString() + " not a valid path in ";
    logger.error("Could not parse " + target + ". " + pathInfo + ( typeof object === "object" ? JSON.stringify(object).substring(0, 300) : object))

  }

}

module.exports = Util;
