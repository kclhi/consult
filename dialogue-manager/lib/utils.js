const request = require('request');
const fs = require('fs');
const config = require('config');
const logger = require('../config/winston');

class Utils {

  // Does the item at the end of the path specified exist? If so, return it.
  static validPath(object, path) {

    if (!object) {

      logger.error("Valid path check error. Object is null.");
      return false;

    }

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

      if ( typeof string === "object" ) return string;

      logger.error("Could not parse: " + string + " Issue: " + e);
      return false;

    }

    return parsed;

  }

  static keyify(obj, prefix='') {

    return Object.keys(obj).reduce((res, el) => {
      if( Array.isArray(obj[el]) ) {
        return res;
      } else if( typeof obj[el] === 'object' && obj[el] !== null ) {
        return [...res, ...Utils.keyify(obj[el], prefix + el + '.')];
      } else {
        return [...res, prefix + el];
      }
    }, []);

  }

  // Resolve string paths in JSON objects.
  static resolvePath(path, obj=self, separator='.') {

    var properties = Array.isArray(path) ? path : path.split(separator)
    return properties.reduce((prev, curr) => prev && prev[curr], obj)

  }

  // If a string path in a JSON object has a wildcard, resolve to value for every child (path). TODO: only assumes single wildcard.
  static resolve(path, obj) {

    if ( path.indexOf("*") > -1 ) {

      var pre = path.split(".*")[0];
      var post = path.split(".*")[1];
      var values = [];

      for ( const child in resolve(pre, obj) ) {

        values.push(Utils.resolvePath(pre + "." + child + post, obj));

      }

      return values;

    } else {

      return Utils.resolvePath(path, obj);

    }

  }

  static replaceAll(str, find, replace) {

    return str.replace(new RegExp(find, 'g'), replace);

  }

}

module.exports = Utils;
