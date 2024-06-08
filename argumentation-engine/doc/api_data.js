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
            "description": "<p>[symptom|notrecommend|preference|selfcheck].</p>"
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
            "description": "<p>Patient data in JSON format (e.g. { 'pdata':[{'res.c271649006':'no alert','res.c271650006':'no alert','pid':'07209f10-58a4-11e9-994c-cd7260ae2b18','c271649006':82,'c271650006':53,'c8867h4':53,'datem':'2018-01-10','date.month':'2018-01-01','time':'00:00:00','weekday':'Wednesday','birthDate':'1952-02-17','age':67,'ethnicity':'black_african', 'medication2' : 'Thiazide', 'medication1': 'NSAID', 'problem1': 'Osteoarthritis', 'problem2': 'Hypertension'}] })</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "expl",
            "description": "<p>If this is one 1, the explanation manager will be invoked to generate explanations.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "filter",
            "description": "<p>A comma-separated list of scheme names. The argumentation results will be filtered according to this list.</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": ": 's1'",
        "content": "# Ask for a painkiller for backpain by providing explanations.\ncurl --request GET http://localhost:5000/argengine/chatbot/s1",
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
            "description": "<p>Argumentation results together with textual explanations.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./chatbot.py",
    "groupTitle": "Chatbot"
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./doc/main.js",
    "group": "_home_sisyphos_Desktop_EngineGit_argumentation_engine_doc_main_js",
    "groupTitle": "_home_sisyphos_Desktop_EngineGit_argumentation_engine_doc_main_js",
    "name": ""
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./docs/main.js",
    "group": "_home_sisyphos_Desktop_EngineGit_argumentation_engine_docs_main_js",
    "groupTitle": "_home_sisyphos_Desktop_EngineGit_argumentation_engine_docs_main_js",
    "name": ""
  }
] });
