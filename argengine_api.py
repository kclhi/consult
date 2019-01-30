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

            resp = requests.post('http://localhost:5000/argengine/datascience', data={'data': patient})
            
            resp.json = json.loads(resp.text)
            
            # read the generated facts file
            params.append("DEMO/"+resp.json['patient.id']+"-facts.dl")

        if name == 'bob-d1':
            import requests
            import json

            patient = json.dumps({'patient.id':'bob','raised_bp':'1','last.sys':142,'last.dia':86,'pid':'bob','age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'})

            resp = requests.post('http://localhost:5000/argengine/datascience', data={'data': patient})
            
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
        
        id = pdict['patient.id']
        age = pdict['age']
        eth = pdict['ethnicity']
        bp = pdict['raised_bp']
        
        facts=''.join(['patient(', id ,').\n', 'age(', id, ',', str(age),').\n', 'ethnic_origin(', id, ',', eth,').\n'])
        
        filename = "argengine/DEMO/"+id+"-facts.dl"
        import os
        if os.path.exists(filename):
            os.remove(filename)
        
        f= open(filename,"w+")
        f.write(facts)
        f.close()
        
        return {'patient.id': id}
    
class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}
     
     
        
# example curl query: curl http://localhost:5000/argengine/chatbot -d "pid=1234&sid=5678&keyname=symptom&value=backpain&iterno=1" -X POST -v
class ChatBot(Resource):
    def get(self):
        return {'hello':'world'}
        
    def post(self):
        pid = request.form['pid']
        sid = request.form['sid']
        keyname = request.form['keyname']
        value = request.form['value']
        iterno = request.form['iterno']
        
        params = list()
            
        ####### get the static reasoning files
        params.append("ground.dl")
        params.append("metalevel.dl") # by default metalevel semantics are used.
        params.append("rules.dl") # rules that will be used for reasoning.
            
        ####### get the query TODO
        query=''
        if str(keyname) == 'symptom':
            if str(value) == 'backpain':
                query = 'suffers_from('+pid+',backpain,t'+iterno+').\n'
                    
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
        params.append("DEMO/1234.dl") # TODO patient facts file should be the last parameter
            
        ####### run the reasoning engine
        hostip = request.host
        result_json=parse_aspartix.run_aspartix_web(hostip,params)
            
        return result_json


# routing
api.add_resource(HelloWorld, '/')
api.add_resource(ChatBot, '/argengine/chatbot')
api.add_resource(InvokeEngine, '/argengine/<string:name>') # by example name
api.add_resource(DataScience, '/argengine/datascience')



if __name__ == '__main__':
    app.run(debug=True)
    
# pip install Flask
# pip install flask-restful
