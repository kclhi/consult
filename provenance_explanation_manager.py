import schemes # explanation schemes
from explanation_manager import ExplanationManager
import lib.provenance as Provenance
import lib.template as Template
import uuid

class ProvenanceExplanationManager(ExplanationManager):

    @staticmethod
    def add(id, fragment, templateID, templatePath):

        documentID = "data-" + id;
        fragmentID = "frag-" + id;

        Provenance.new(documentID, 'http://name.space');
        Provenance.namespace(documentID, 'sub', 'http://sub.name.space');

        with open(templatePath,'r') as templateFile:
            template = templateFile.read()

        Provenance.register(documentID, templateID, template);
        Provenance.generate(documentID, templateID, fragmentID, fragment);

    @staticmethod
    def getExplanation(query_data, filter_words=None):

        provenanceInformation = super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, "provenance")["ext0"]["winning"]; # Send this to the template server

        ID = str(uuid.uuid4());

        # TODO: multiple fragments for multiple recommendations from same provenance response (or multiple associated recommendation information, such as sensor data).
        fragmentData = {
            "var:argumentation": "CONSULT Argumentation Engine",
            "var:patient": "PATIENT_" + ID,
            "vvar:patientID": provenanceInformation["arg9"]["bindings"]["T"], # TODO: dynamically connect provenance output from argumentation engine to fragment data, rather than hardcoding args.
            "var:giveRecommendation": "GIVE_RECOMMENDATION_" + ID,
            "vvar:symptomFinding": provenanceInformation["arg6"]["bindings"]["T"],
            "var:symptom": "SYMPTOM_" + ID,
            "vvar:sensorReadingValue": provenanceInformation["arg5"]["bindings"]["T"],
            "var:sensorReading": "SENSOR_READING_" + ID,
            "vvar:recommendationDrug": provenanceInformation["arg4"]["bindings"]["S"],
            "var:recommendation": "RECOMMENDATION_" + ID,
            "var:guideline": "GUIDELINE_" + ID,
            "vvar:guidelineDescription": "NHS recommendations"
        }

        ProvenanceExplanationManager.add(ID, Template.createFragmentFromTemplate("provenance-templates/json/recommendation.json", fragmentData), "template-recommendation", "provenance-templates/json/recommendation.json");

        return super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, filter_words);
