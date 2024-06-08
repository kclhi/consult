import schemes # explanation schemes

class ExplanationManager(object):

    @staticmethod
    def getExplanation(query_data, filter_words=None):

        pdict = query_data

        filter_array = []

        if filter_words:
            if ',' in filter_words:
                filter_array = filter_words.split(',')
            else:
                filter_array = [filter_words]

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
                    if 'filter_array' in locals() and len(filter_array) != 0: # we want to filter results according to scheme names
                        for sname in filter_array:
                            if sname in arg:
                                winning['arg'+str(i)]= {'name': arg, 'expl': exp, 'bindings': binds}
                    else:
                        # all the winning arguments will be returned
                        winning['arg'+str(i)]= {'name': arg, 'expl': exp, 'bindings': binds}
                    i+=1

        if not bool(winning):
            winning = "No winning arguments."

        pdict["ext0"]["AF_json"] = json_graph.node_link_data(AF_graph_expl) # get the updated graph with explanations
        pdict["ext0"]["winning"] = winning
        return pdict
