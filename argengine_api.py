from flask import Flask, request
from flask_restful import Resource, Api, reqparse

import sys
sys.path.insert(0, './argengine')
import parse_aspartix

app = Flask(__name__)
api = Api(app)

'''
    invoke argumentation engine by example name for the demo
    name is one of the followings:
    bob-d1
    bittorrent-vaf
    eric-eaf
    firewall-paf
    gp-eaf
    jane
    jane-datascience
    jane-ti
    metalevel-avaf with semantic=prefex option
    metalevel-paf
    metalevel-weather-eaf
'''
class InvokeEngine(Resource):
    def get(self,name):

        # we use the grounded semantics first
        sem = request.args.get('semantic','ground')
        #sem = request.args.get('semantic','prefex')

        params = list()
        params.append(sem+".dl")
        params.append("metalevel.dl") # by default metalevel semantics are used.

        if name == 'jane-datascience':
            import requests
            import json

            patient = json.dumps({'patient.id':'jane','raised_bp':'1','last.sys':142,'last.dia':86,'pid':'jane','age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'})

            resp = requests.post('http://0.0.0.0:5000/argengine/datascience', data={'data': patient})

            resp.json = json.loads(resp.text)

            # read the generated facts file
            params.append("DEMO/"+resp.json['patient.id']+"-facts.dl")

        if name == 'bob-d1':
            import requests
            import json

            patient = json.dumps({'patient.id':'bob','raised_bp':'1','last.sys':142,'last.dia':86,'pid':'bob','age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'})

            resp = requests.post('http://0.0.0.0:5000/argengine/datascience', data={'data': patient})

            resp.json = json.loads(resp.text)

            # read the generated facts file
            params.append("DEMO/"+resp.json['patient.id']+"-facts.dl")

        params.append("DEMO/"+name+".dl")

        hostip = request.host
        result_json=parse_aspartix.run_aspartix_web(hostip,params)

        return result_json

class DataScience(Resource):
    def get(self):
         return {'hello': 'world'}

    def post(self):
        patient_data = request.form['data']
        import json
        pdict = json.loads(patient_data)

        id = str(pdict['patient.id'])
        age = pdict['age']
        eth = pdict['ethnicity']
        bp = pdict['raised_bp']

        facts=''.join(['patient(', id ,').\n', 'age(', id, ',', str(age),').\n', 'ethnic_origin(', id, ',', eth,').\n'])
        if bp:
            facts = facts + 'side_effect(hbp).\n'

        #filename = "argengine/DEMO/"+id+"-facts.dl"
        #import os
        #if os.path.exists(filename):
        #    os.remove(filename)

        #f= open(filename,"w+")
        #f.write(facts)
        #f.close()

        return {'patient.facts': facts}

class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}

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
class ChatBot(Resource):
    def get(self):
        return {'hello':'world'}

    def post(self):
        query_data = request.form['data']
        import json
        pdict = json.loads(query_data)

        pid = str(pdict['pid'])
        sid = str(pdict['sid'])
        keyname = pdict['keyname']
        value = pdict['value']
        pdata = pdict['pdata']

        print pdata

        params = list()

        ####### get the static reasoning files
        params.append("ground.dl")
        params.append("metalevel.dl") # by default metalevel semantics are used.
        params.append("rules.dl") # rules that will be used for reasoning.

        ####### get the query TODO
        query=''
        if str(keyname) == 'symptom':
            if str(value) == 'backpain':
                query = 'suffers_from('+pid+',backpain).\n'
        if str(keyname) == 'preference':
            v1,v2 = str(value).split(',')
            query = 'arg(preferred('+v1+','+v2+')).\n'

        import os
        if not os.path.exists('data/'+pid): # new patient
            os.makedirs('data/'+pid)

        if not os.path.exists('data/'+pid+'/'+sid): # new session
            os.makedirs('data/'+pid+'/'+sid)

            ####### create a new query file
            f= open('data/'+pid+'/'+sid+'/'+'queries.dl',"w+")
            # write the new query to it
            f.write(query)
            # close the file
            f.close()

        else:
            ####### append to existing query file
            f= open('data/'+pid+'/'+sid+'/'+'queries.dl',"a")
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
        f= open('data/'+pid+'/'+sid+'/'+pid+'.dl',"w+")
        # write the patient facts to it
        f.write(pfacts)
        # close the file
        f.close()

        # add the patient facts to the params
        params.append('../data/'+pid+'/'+sid+'/'+pid+'.dl')

        #print params

        ####### run the reasoning engine
        hostip = request.host
        result_json=parse_aspartix.run_aspartix_web(hostip,params)

        return result_json

# chatbot testing class
class TestChatbot(Resource):
    def get(self,name):
        import requests
        import json

        if name == 's1':
            query = {'pid': 1234, 'sid':1, 'keyname': 'symptom', 'value':'backpain', 'pdata': {'patient.id':1234,'raised_bp':0,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', data={'data': json.dumps(query)})


        if name == 's2-1':
            query = {'pid': 1234, 'sid':2, 'keyname': 'symptom', 'value':'backpain', 'pdata': {'patient.id':1234,'raised_bp':1,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', data={'data': json.dumps(query)})

        if name == 's2-2':
            query = {'pid': 1234, 'sid':2, 'keyname': 'preference', 'value':'paracetamol,codeine', 'pdata': {'patient.id':1234,'raised_bp':1,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}

            resp = requests.post('http://0.0.0.0:5000/argengine/chatbot', data={'data': json.dumps(query)})

        return json.loads(resp.text)


# routing
api.add_resource(HelloWorld, '/')
api.add_resource(ChatBot, '/argengine/chatbot')
api.add_resource(InvokeEngine, '/argengine/<string:name>') # by example name
api.add_resource(DataScience, '/argengine/datascience')

api.add_resource(TestChatbot, '/argengine/chatbot/<string:name>') # chatbot testing

if __name__ == '__main__':
    app.run(debug=True)

# pip install Flask
# pip install flask-restful
