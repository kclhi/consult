import schemes # explanation schemes
from explanation_manager import ExplanationManager

import uuid, json
from jsonpath_ng import jsonpath, parse
import lib.provenance as Provenance
import lib.template as Template

class ProvenanceExplanationManager(ExplanationManager):

    @staticmethod
    def add(id, fragment, templateID, templatePath):

        documentID = "data-" + id;
        fragmentID = "frag-" + id;

        Provenance.new(documentID, 'http://name.space');
        Provenance.namespace(documentID, 'sub', 'http://sub.name.space');

        with open(templatePath,'r') as templateFile:
            template = templateFile.read()
            Provenance.new_template(templateID, template);
            Provenance.register_template(documentID, templateID);
            Provenance.generate(documentID, templateID, fragmentID, fragment);

    @staticmethod
    def getExplanation(query_data, filter_words=None):

        provenanceInformation = super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, "provenance")["ext0"]["winning"];
        jsonpath_expression = parse('$.*.bindings.S')
        matches = jsonpath_expression.find(provenanceInformation)

        ID = str(uuid.uuid4());

        # TODO: multiple fragments for multiple recommendations from same provenance response (or multiple associated recommendation information, such as sensor data).
        fragmentData = {
            "var:argumentation": "CONSULT Argumentation Engine",
            "var:patient": "PATIENT_" + ID,
            "vvar:patientID": [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "wasAssociatedWith"][0],
            "var:giveRecommendation": "GIVE_RECOMMENDATION_" + ID,
            "vvar:symptomFinding": [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "used" and len(match.context.value["T"]) > 3][0], # ~MDC Hack for string. Do proper parsing.
            "var:symptom": "SYMPTOM_" + ID,
            "vvar:sensorReadingValue": [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "used" and len(match.context.value["T"]) <= 3][0], # ~MDC Hack for int. Do proper parsing.
            "var:sensorReading": "SENSOR_READING_" + ID,
            "vvar:recommendationDrug": [match.context.value["S"] for match in matches if match.context.value["R"] == "wasGeneratedBy" and match.context.value["T"] == "giveRecommendation"][0],
            "var:recommendation": "RECOMMENDATION_" + ID,
            "var:guideline": "GUIDELINE_" + ID,
            "vvar:guidelineDescription": "NHS recommendations"
        }

        ProvenanceExplanationManager.add(ID, Template.createFragmentFromTemplate("provenance-templates/json/recommendation.json", fragmentData), "template-recommendation", "provenance-templates/json/recommendation.json");

        return super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, filter_words);
