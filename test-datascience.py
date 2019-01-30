import requests
import json

patient = json.dumps({'patient.id':'jane','raised_bp':'1','last.sys':142,'last.dia':86,'pid':'jane','age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'})

r = requests.post('http://localhost:5000/argengine/datascience', data={'data': patient})

print r
