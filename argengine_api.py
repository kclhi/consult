from flask import Flask, request
from flask_restful import Resource, Api, reqparse

import os, sys, json, requests

sys.path.insert(0, './argengine')
from data_science import DataScience
from explanation_manager import ExplanationManager
import parse_aspartix, schemes # explanation schemes

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

        pdict = request.get_json();

        print pdict;

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
        pfacts = DataScience.getPatientFacts(pdata);

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
        if expl: result_json = ExplanationManager.getExplanation(result_json)

        print "Returning result: " + str(result_json)
        return result_json

# chatbot testing class
class TestChatbot(Resource):
    def get(self,name):
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

app = Flask(__name__)
api = Api(app)

# routing
api.add_resource(ChatBot, '/argengine/chatbot')
api.add_resource(TestChatbot, '/argengine/chatbot/<string:name>') # chatbot testing

if __name__ == '__main__':

    app.run(debug=True)
