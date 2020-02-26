import schemes # explanation schemes
from explanation_manager import ExplanationManager

import uuid, json
from jsonpath_ng import jsonpath, parse
import lib.provenance as Provenance
import lib.template as Template

class ProvenanceExplanationManager(ExplanationManager):

    @staticmethod
    def add(id, fragment, templatePath, port):

        documentID = "data-" + id;
        fragmentID = "frag-" + id;

        Provenance.new(documentID, 'http://name.space', port);
        Provenance.namespace(documentID, 'sub', 'http://sub.name.space', port);

        if ( "template-recommendation" not in Provenance.list_documents(port) ):
            with open(templatePath,'r') as templateFile:
                template = templateFile.read()
                Provenance.new_template("template-recommendation", template, port);

        Provenance.register_template(documentID, "template-recommendation", port);
        Provenance.generate(documentID, "template-recommendation", fragmentID, fragment, port);

    @staticmethod
    def addNRChain(id, fragment, templatePath):
        ProvenanceExplanationManager.add(id, fragment, templatePath, 10000);

    @staticmethod
    def addNRBucket(id, fragment, templatePath):
        ProvenanceExplanationManager.add(id, fragment, templatePath, 10001);

    @staticmethod
    def addNRSelinux(id, fragment, templatePath):
        ProvenanceExplanationManager.add(id, fragment, templatePath, 10002);

    @staticmethod
    def getExplanation(query_data, filter_words=None):

        provenanceInformation = super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, "provenance")["ext0"]["winning"];
        jsonpath_expression = parse('$.*.bindings.S')
        matches = jsonpath_expression.find(provenanceInformation)

        ID = str(uuid.uuid4());

        patientIdMatches = [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "wasAssociatedWith"];
        symptomFindingMatches = [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "used" and len(match.context.value["T"]) > 3]; # ~MDC Hack for string. Do proper parsing.
        sensorReadingValueMatches = [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "used" and len(match.context.value["T"]) <= 3]; # ~MDC Hack for int. Do proper parsing.
        recommendationDrugMatches = [match.context.value["S"] for match in matches if match.context.value["R"] == "wasGeneratedBy" and match.context.value["T"] == "giveRecommendation"];

        if ( len(patientIdMatches) > 0 and len(symptomFindingMatches) > 0 and len(sensorReadingValueMatches) > 0 and len(recommendationDrugMatches) > 0 ):

            # TODO: multiple fragments for multiple recommendations from same provenance response (or multiple associated recommendation information, such as sensor data).
            fragmentData = {
                "var:argumentation": ":CONSULT Argumentation Engine",
                "var:patient": ":PATIENT_" + ID,
                "vvar:patientID": ":" + patientIdMatches[0].replace("_", ""),
                "var:giveRecommendation": ":GIVE_RECOMMENDATION_" + ID,
                "vvar:symptomFinding": ":" + symptomFindingMatches[0],
                "var:symptom": ":SYMPTOM_" + ID,
                "vvar:sensorReadingValue": ":" + sensorReadingValueMatches[0],
                "var:sensorReading": ":SENSOR_READING_" + ID,
                "vvar:recommendationDrug": ":" + recommendationDrugMatches[0],
                "var:recommendation": ":RECOMMENDATION_" + ID,
                "var:guideline": ":GUIDELINE_" + ID,
                "vvar:guidelineDescription": ":NHS"
            }

            fragment = Template.createFragmentFromTemplate("provenance-templates/json/recommendation.json", fragmentData);
            print("Fragment: " + str(fragment));

            # Chain
            ProvenanceExplanationManager.addNRChain(ID, fragment, "provenance-templates/json/recommendation.json");

            # Bucket
            ProvenanceExplanationManager.addNRBucket(ID, fragment, "provenance-templates/json/recommendation.json");

            # selinux
            ProvenanceExplanationManager.addNRSelinux(ID, fragment, "provenance-templates/json/recommendation.json");

        else:
            print("Insufficient data to create recommendation fragment.")

        return super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, filter_words);
