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

      console.log("Could not parse: " + e + " " + JSON.stringify(string));
      return false;

    }

    return parsed;

  }

}

module.exports = Util;
