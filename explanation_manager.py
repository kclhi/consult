import schemes

class ExplanationManager():

    @staticmethod
    def getExplanation(query_data):

        pdict = query_data

        # get the graph for the first extension ext0
        from networkx.readwrite import json_graph
        AF_graph = json_graph.node_link_graph(pdict["ext0"]["AF_json"])
        AF_graph_expl = AF_graph

        # prepare a set of winning arguments
        i=1
        winning = {}

        for n in AF_graph.nodes:
            atts = AF_graph.node[n].keys()
            if 'color' in atts:
                if AF_graph.node[n]['color'] == "green" and "justified" in n: # find justified arguments
                    arg = n[10:-1] # get the name of the justified argument
                    sname = arg.split("(")[0]
                    binds,exp = getattr(schemes, sname)(arg)
                    AF_graph_expl.node[n]['expl'] = exp
                    winning['arg'+str(i)]= {'name': arg, 'expl': exp, 'bindings': binds}
                    i+=1

        pdict["ext0"]["AF_json"] = json_graph.node_link_data(AF_graph_expl) # get the updated graph with explanations
        pdict["ext0"]["winning"] = winning
        return pdict
