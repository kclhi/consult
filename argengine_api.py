from flask import Flask, request
from flask_restful import Resource, Api, reqparse

import sys
sys.path.insert(0, './argengine')
import parse_aspartix
import schemes # explanation schemes

app = Flask(__name__)
api = Api(app)

class DataScience(Resource):

    def post(self):
        patient_data = request.form['data']
        import json
        pdict = json.loads(patient_data)
        pdict = pdict[0];

        id = "p"+pdict['pid'].replace("-","_")
        age = pdict['age']
        eth = pdict['ethnicity'].lower()

        last_sys = pdict['c271649006']
        last_dia = pdict['c271650006']

        res_sbp = pdict['res.c271649006']
        res_dbp = pdict['res.c271650006']
        flags = ['Amber Flag','Red Flag','Double Red Flag']

        facts=''.join(['patient(', id ,').\n',
        'age(', id, ',', str(age),').\n',
        'ethnic_origin(', id, ',', eth,').\n',
        'systolic(', id, ',', str(last_sys),').\n',
        'diastolic(', id, ',', str(last_dia),').\n'])

        if (res_sbp in flags) or (res_dbp in flags):
            facts = facts + 'side_effect(hbp).\n'

        print "Patient facts: " + str(facts);

        return {'patient.facts': facts}

class ChatBot(Resource):

    """
    @api {post} /argengine/chatbot Main reasoning endpoint
    @apiName Reasoner
    @apiGroup Chatbot

    @apiParam {Number} pid Patient ID.
    @apiParam {Number} sid Session ID.
    @apiParam {String} keyname [symptom|preference].
    @apiParam {Number} value Value for keyname.
    @apiParam {String} pdata Patient data in JSON format (e.g. {'patient.id':1234, 'raised_bp':0, 'last.sys':142, 'last.dia':86, 'pid':1234, 'age':60,  'ethnicity':'black_african', 'testresult1':125, 'testresult1.type':'sys'})

    @apiExample {curl} : 'Ask for a painkiller for backpain'
        curl --request POST http://localhost:5000/argengine/chatbot --data '{"pid": 1234, "sid": 1, "keyname": "symptom", "value": "backpain", "pdata": {"patient.id": 1234, "raised_bp": 0, "last.sys": 142, "last.dia": 86, "pid": 1234, "age": 60, "ethnicity": "black_african", "testresult1": 125, "testresult1.type": "sys"}}'

    @apiExample {curl} : 'High blood pressure observed. Ask for a painkiller for backpain.'
        curl --request POST http://localhost:5000/argengine/chatbot --data {'pid': 1234, 'sid':2, 'keyname': 'symptom', 'value':'backpain', 'pdata': {'patient.id':1234,'raised_bp':1,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}'

    @apiExample {curl} : 'High blood pressure observed. Ask for a painkiller for backpain. Express drug preference.'
        curl --request POST http://localhost:5000/argengine/chatbot --data '{'pid': 1234, 'sid':2, 'keyname': 'preference', 'value':'paracetamol,codeine', 'pdata': {'patient.id':1234,'raised_bp':1,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}'

    @apiSuccess {String} response Argumentation results.
    """
    def post(self):

        import json
        #pdict = json.loads(query_data)
        pdict = request.get_json();

        #pid = str(pdict['pid']).replace("-", "")[:5];
        pid = "p"+pdict['pid'].replace("-","_") #TODO
        sid = str(pdict['sid'])
        keyname = pdict['keyname']
        value = pdict['value']
        pdata = pdict['pdata']

        expl = pdict['expl'] if "expl" in pdict.keys() else 0  # if 1 will call the Explanation Manager

        params = list()

        ####### get the static reasoning files
        params.append('ground.dl')
        params.append('metalevel.dl') # by default metalevel semantics are used.
        params.append('rules.dl') # rules that will be used for reasoning.

        ####### get the query TODO
        query=''
        if str(keyname) == 'symptom':
            if str(value) == 'backpain':
                query = 'suffers_from('+pid+',backpain).\n'
        elif str(keyname) == 'preference':
            v1,v2 = str(value).split(',')
            query = 'arg(preferred('+v1+','+v2+')).\n'
        elif str(keyname) == 'selfcheck':
            # we do nothing extra, used for engine initiated dialogues
            query=''
        else:
            return 'Unknown keyname: '+ str(keyname)

        import os
        if not os.path.exists('data/'+pid): # new patient
            os.makedirs('data/'+pid)

        if not os.path.exists('data/'+pid+'/'+sid): # new session
            os.makedirs('data/'+pid+'/'+sid)

            ####### create a new query file
            f= open('data/'+pid+'/'+sid+'/'+'queries.dl','w+')
            # write the new query to it
            f.write(query)
            # close the file
            f.close()

        else:
            if query != '':
                ####### append to existing query file
                f= open('data/'+pid+'/'+sid+'/'+'queries.dl','a')
                # write the new query to it
                f.write(query)
                # close the file
                f.close()

        ####### add the query file to the engine parameters
        params.append('../data/'+pid+'/'+sid+'/'+'queries.dl')

        ####### get the facts about the patient
        # get the patient facts
        import requests
        resp = requests.post('http://0.0.0.0:5000/argengine/datascience', data={'data': json.dumps(pdata)})
        resp.json = json.loads(resp.text)
        pfacts = resp.json['patient.facts']

        ####### create a new query file
        f= open('data/'+pid+'/'+sid+'/'+pid+'.dl','w+')
        # write the patient facts to it
        f.write(pfacts)
        # close the file
        f.close()

        # add the patient facts to the params
        params.append('../data/'+pid+'/'+sid+'/'+pid+'.dl')

        ####### run the reasoning engine
        hostip = request.host
        result_json=parse_aspartix.run_aspartix_web(hostip,params)

        # invoke the Explanation Manager
        if expl:
            resp = requests.post('http://0.0.0.0:5000/argengine/explanation', data={'data': json.dumps(result_json)})
            result_json_expl = json.loads(resp.text)
            return result_json_expl

        return result_json

class ExplanationManager(Resource):
    def post(self):
        query_data = request.form['data']
        import json
        pdict = json.loads(query_data)

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

# chatbot testing class
class TestChatbot(Resource):
    def get(self,name):
        import requests
        import json
            # TODO data format check @martin, message passing security (https?)
        if name == 's1':
            query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', json=query)


        if name == 's2-1':
            query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'2','keyname':'symptom','value':'backpain','pdata':[{'res.c271649006':'Amber Flag','res.c271650006':'Amber Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':86,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', json=query)

        if name == 's2-2':
            query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'2','keyname': 'preference', 'value':'paracetamol,codeine','pdata':[{'res.c271649006':'Amber Flag','res.c271650006':'Amber Flag','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':142,'c271650006':86,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', json=query)

        if name == 's3-1':
            query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':150,'c271650006':95,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', json=query)

        if name == 's3-2':
            query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'symptom','value':'backpain','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', json=query)

        if name == 's4': # selfcheck example
            query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'selfcheck','value':'','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', json=query)

        if name == 's5': # unknown keyname example
            query = {'pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','sid':'1','keyname':'dummy','value':'','pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':180,'c271650006':110,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}], 'expl':1}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', json=query)

        return json.loads(resp.text)


# routing
api.add_resource(ChatBot, '/argengine/chatbot')
api.add_resource(DataScience, '/argengine/datascience')
api.add_resource(ExplanationManager, '/argengine/explanation')
api.add_resource(TestChatbot, '/argengine/chatbot/<string:name>') # chatbot testing

if __name__ == '__main__':
    app.run(debug=True)
