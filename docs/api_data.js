define({ "api": [
  {
    "type": "post",
    "url": "/argengine/chatbot",
    "title": "Main reasoning endpoint",
    "name": "Reasoner",
    "group": "Chatbot",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "pid",
            "description": "<p>Patient ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "sid",
            "description": "<p>Session ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "keyname",
            "description": "<p>[symptom|preference].</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "value",
            "description": "<p>Value for keyname.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "pdata",
            "description": "<p>Patient data in JSON format (e.g. {'patient.id':1234, 'raised_bp':0, 'last.sys':142, 'last.dia':86, 'pid':1234, 'age':60,  'ethnicity':'black_african', 'testresult1':125, 'testresult1.type':'sys'})</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": ": 'Ask for a painkiller for backpain'",
        "content": "curl --request POST http://localhost:5000/argengine/chatbot --data '{\"pid\": 1234, \"sid\": 1, \"keyname\": \"symptom\", \"value\": \"backpain\", \"pdata\": {\"patient.id\": 1234, \"raised_bp\": 0, \"last.sys\": 142, \"last.dia\": 86, \"pid\": 1234, \"age\": 60, \"ethnicity\": \"black_african\", \"testresult1\": 125, \"testresult1.type\": \"sys\"}}'",
        "type": "curl"
      },
      {
        "title": ": 'High blood pressure observed. Ask for a painkiller for backpain.'",
        "content": "curl --request POST http://localhost:5000/argengine/chatbot --data {'pid': 1234, 'sid':2, 'keyname': 'symptom', 'value':'backpain', 'pdata': {'patient.id':1234,'raised_bp':1,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}'",
        "type": "curl"
      },
      {
        "title": ": 'High blood pressure observed. Ask for a painkiller for backpain. Express drug preference.'",
        "content": "curl --request POST http://localhost:5000/argengine/chatbot --data '{'pid': 1234, 'sid':2, 'keyname': 'preference', 'value':'paracetamol,codeine', 'pdata': {'patient.id':1234,'raised_bp':1,'last.sys':142,'last.dia':86,'pid':1234,'age':60,'ethnicity':'black_african','testresult1':125,'testresult1.type':'sys'}}'",
        "type": "curl"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>Argumentation results.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./argengine_api.py",
    "groupTitle": "Chatbot"
  }
] });
