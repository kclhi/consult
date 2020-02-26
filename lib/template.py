import json
from collections import OrderedDict

def identifyVar(attribute, fragmentData, untypedVars, typedVars):

    QUALIFIED_NAME = "prov:QUALIFIED_NAME";

    if ("var" in attribute):
        data = "";
        if ( attribute in fragmentData.keys() ): data = fragmentData[attribute];
        if ("vvar:" in attribute):
            untypedVars.append([attribute, data]);
        else:
            typedVars.append([attribute, data, QUALIFIED_NAME]); # var substitutions are always qnames.

def identifyType(attribute, value, untypedVars, typedVars):
    if (attribute == "type" and len(untypedVars) > 0):
        lastVar = untypedVars[len(untypedVars) - 1]
        lastVar.append(value);
        typedVars.append(lastVar);
        untypedVars.pop();

def createFragmentFromTemplate(templatePath, fragmentData):
    untypedVars = [];
    typedVars = [];
    with open(templatePath) as json_file:
        data = json.load(json_file, object_pairs_hook=OrderedDict)
        for entityType in data:
            for entity in data[entityType]:
                identifyVar(entity, fragmentData, untypedVars, typedVars);
                if isinstance(data[entityType][entity], dict):
                    for attribute in data[entityType][entity]:
                        if isinstance(data[entityType][entity][attribute], dict):
                            for attributeAttribute in data[entityType][entity][attribute]:
                                attributeValue = data[entityType][entity][attribute][attributeAttribute];
                                identifyVar(attributeValue, fragmentData, untypedVars, typedVars);
                                identifyType(attributeAttribute, attributeValue, untypedVars, typedVars)
    jsonFragment = {};
    for typedVar in typedVars:
        jsonFragment[typedVar[0]] = [];
        jsonFragment[typedVar[0]].append({"$": typedVar[1], "type": typedVar[2]})

    return json.dumps(jsonFragment);

if __name__ == '__main__':

    fragmentData = {
        "var:symptom": "cold"
    }
    print createFragmentFromTemplate("../provenance-templates/json/recommendation.json", fragmentData);
