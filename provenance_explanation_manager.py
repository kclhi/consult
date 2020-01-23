import schemes # explanation schemes
from explanation_manager import ExplanationManager
import lib.provenance as Provenance

class ProvenanceExplanationManager(ExplanationManager):

    def add(id, fragment, templateID, templatePath, callback):

        documentID = "data-" + id;
        fragmentID = "frag-" + id;

        fragment = fragment.replace("\\[id\\]", id);

        Provenance.new(documentID, 'http://name.space');
        Provenance.namespace(documentID, 'sub', 'http://sub.name.space');

        with open(templatePath,'r') as templateFile:
            template = templateFile.read()

        Provenance.register(documentID, templateID, template);
        Provenance.generate(documentID, templateID, fragmentID, fragment);

    @staticmethod
    def getExplanation(query_data, filter_words=None):

        print super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, "provenance"); # Send this to the template server

        return super(ProvenanceExplanationManager, ProvenanceExplanationManager).getExplanation(query_data, filter_words);

# Goals: (1) Gather provenance information on recommendations given (2) Use provenance template information to provide an explanation of why these recommendations are given (XAI via provenance)
