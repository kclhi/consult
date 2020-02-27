const fs = require('fs');

class Template {

  static instanceOfDictionary(v) {

      return typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date);

  }

  static identifyVar(attribute, fragmentData, untypedVars, typedVars) {

      const QUALIFIED_NAME = "prov:QUALIFIED_NAME";

      if ( attribute.indexOf("var") > -1 ) {

          var data = "";

          if ( Object.keys(fragmentData).indexOf(attribute) > -1 ) data = fragmentData[attribute];

          if ( attribute.indexOf("vvar") > -1 ) {

              untypedVars.push([attribute, data]);

          } else {

              typedVars.push([attribute, data, QUALIFIED_NAME]); // var substitutions are always qnames.

          }

      }

  }

  static identifyType(attribute, value, untypedVars, typedVars) {

      if ( attribute == "type" && untypedVars.length > 0 ) {

          var lastVar = untypedVars[untypedVars.length - 1]
          lastVar.push(value);
          typedVars.push(lastVar);
          untypedVars.pop();

      }

  }

  static createFragmentFromTemplate(templatePath, fragmentData) {

      var untypedVars = [];
      var typedVars = [];

      var document = fs.readFileSync(templatePath, 'utf8');
      var data = JSON.parse(document)

      const jsonAsArray = Object.keys(data).map(function (key) {
        return data[key];
      })
      .sort(function (itemA, itemB) {
        return itemA.score < itemB.score;
      });

      for ( const entityType in data ) {

          for ( const entity in data[entityType] ) {

              Template.identifyVar(entity, fragmentData, untypedVars, typedVars);

              if ( Template.instanceOfDictionary(data[entityType][entity]) ) {

                  for ( const attribute in data[entityType][entity] ) {

                      if ( Template.instanceOfDictionary(data[entityType][entity][attribute]) ) {

                          for ( const attributeAttribute in data[entityType][entity][attribute] ) {

                              var attributeValue = data[entityType][entity][attribute][attributeAttribute];
                              Template.identifyVar(attributeValue, fragmentData, untypedVars, typedVars);
                              Template.identifyType(attributeAttribute, attributeValue, untypedVars, typedVars);

                          }

                      }

                  }

              }

          }

      }

      var jsonFragment = {};

      for ( const typedVar in typedVars ) {

          jsonFragment[typedVars[typedVar][0]] = [];
          jsonFragment[typedVars[typedVar][0]].push({"$": typedVars[typedVar][1], "type": typedVars[typedVar][2]})

      }

      return JSON.stringify(jsonFragment);

  }

  static test(templateName) {

      var fragmentData = {
          "var:symptom": "cold"
      }

      console.log(Template.createFragmentFromTemplate("../provenance-templates/json/" + templateName + ".json", fragmentData));

  }

}

module.exports = Template;
