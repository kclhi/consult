import schemes # explanation schemes
from explanation_manager import ExplanationManager

import uuid, json, configparser, time, logging
from jsonpath_ng import jsonpath, parse
import lib.provenance as Provenance
import lib.template as Template

config = configparser.ConfigParser()
config.read('config/config.ini');

class ProvenanceExplanationManager(ExplanationManager):

    @staticmethod
    def log():

        # Custom log experiment level:
        EXPERIMENT_LEVELV_NUM = 100
        logging.addLevelName(EXPERIMENT_LEVELV_NUM, "EXPERIMENT")
        def experiment(self, message, *args, **kws):
            if self.isEnabledFor(EXPERIMENT_LEVELV_NUM):
                self._log(EXPERIMENT_LEVELV_NUM, message, args, **kws)
        logging.Logger.experiment = experiment

        fileh = logging.FileHandler('experiment.log', 'a')
        formatter = logging.Formatter('%(message)s')
        fileh.setFormatter(formatter)

        log = logging.getLogger("experiment-logger")  # named logger
        for hdlr in log.handlers[:]:  # remove all old handlers
            log.removeHandler(hdlr)
        log.addHandler(fileh)      # set the new handler

        return log;

    @staticmethod
    def add(documentId, fragmentId, fragment, templatePath, port):

        templateId = "template-recommendation";

        Provenance.new(documentId, 'https://kclhi.org.uk', port);
        Provenance.namespace(documentId, 'snomed', 'http://snomed.info/sct', port);

        if ( templateId not in Provenance.list_documents(port) ):
            with open(templatePath,'r') as templateFile:
                template = templateFile.read()
                Provenance.new_template(templateId, template, port);

        Provenance.register_template(documentId, templateId, port);
        Provenance.generate(documentId, templateId, fragmentId, fragment, port);

    @staticmethod
    def addNRChain(documentId, fragmentId, fragment, templatePath):
        POPULATE_START_NR_CHAIN = time.time();
        ProvenanceExplanationManager.add(documentId, fragmentId, fragment, templatePath, config["PROVENANCE_SERVER"]["NR_CHAIN_PORT"]);
        ProvenanceExplanationManager.log().experiment("chain," + str(time.time() - POPULATE_START_NR_CHAIN));

    @staticmethod
    def addNRBucket(documentId, fragmentId, fragment, templatePath):
        POPULATE_START_NR_BUCKET= time.time();
        ProvenanceExplanationManager.add(documentId, fragmentId, fragment, templatePath, config["PROVENANCE_SERVER"]["NR_BUCKET_PORT"]);
        ProvenanceExplanationManager.log().experiment("bucket," + str(time.time() - POPULATE_START_NR_BUCKET));

    @staticmethod
    def addNRSelinux(documentId, fragmentId, fragment, templatePath):
        POPULATE_START_NR_SELINUX = time.time();
        ProvenanceExplanationManager.add(documentId, fragmentId, fragment, templatePath, config["PROVENANCE_SERVER"]["NR_SELINUX_PORT"]);
        ProvenanceExplanationManager.log().experiment("selinux," + str(time.time() - POPULATE_START_NR_SELINUX));

    @staticmethod
    def getExplanation(query_data, filter_words=None):

        provenanceInformation = super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, "provenance")["ext0"]["winning"];
        jsonpath_expression = parse('$.*.bindings.S')
        matches = jsonpath_expression.find(provenanceInformation)

        patientIdMatches = [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "wasAssociatedWith"];
        symptomFindingMatches = [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "used" and len(match.context.value["T"]) > 3]; # ~MDC Hack for string. Do proper parsing.
        sensorReadingValueMatches = [match.context.value["T"] for match in matches if match.context.value["S"] == "giveRecommendation" and match.context.value["R"] == "used" and len(match.context.value["T"]) <= 3]; # ~MDC Hack for int. Do proper parsing.
        recommendationDrugMatches = [match.context.value["S"] for match in matches if match.context.value["R"] == "wasGeneratedBy" and match.context.value["T"] == "giveRecommendation"];

        if ( len(patientIdMatches) > 0 and len(symptomFindingMatches) > 0 and len(sensorReadingValueMatches) > 0 and len(recommendationDrugMatches) > 0 ):

            ID = str(uuid.uuid4());

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

            documentId = "document-" + ID;
            fragmentId = "fragment-" + ID;

            # Chain
            if ( "chain" in config["PROVENANCE_SERVER"]["NR_MECHANISMS"] ): ProvenanceExplanationManager.addNRChain(documentId, fragmentId, fragment, "provenance-templates/json/recommendation.json");

            # Bucket
            if ( "bucket" in config["PROVENANCE_SERVER"]["NR_MECHANISMS"] ): ProvenanceExplanationManager.addNRBucket(documentId, fragmentId, fragment, "provenance-templates/json/recommendation.json");

            # selinux
            if ( "selinux" in config["PROVENANCE_SERVER"]["NR_MECHANISMS"] ): ProvenanceExplanationManager.addNRSelinux(documentId, fragmentId, fragment, "provenance-templates/json/recommendation.json");

        else:
            print("Insufficient data to create recommendation fragment.")

        return super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, filter_words);
