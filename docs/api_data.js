define({ "api": [
  {
    "type": "get",
    "url": "/:patientID/:code/:start/:end",
    "title": "Request patient vitals (Observation) information",
    "name": "GetObservations",
    "group": "Observations",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "patientID",
            "description": "<p>Users unique ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "code",
            "description": "<p>The code of the observation being requested (e.g. Blood pressure: 85354-9).</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "start",
            "description": "<p>The start time of the range of observations to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "end",
            "description": "<p>The end time of the range of observations to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>A list of observation data as an R-formatted table.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./routes/observation.js",
    "groupTitle": "Observations"
  },
  {
    "type": "get",
    "url": "/:patientID",
    "title": "Request patient information",
    "name": "GetPatient",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "patientID",
            "description": "<p>Users unique ID.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "get",
    "url": "/register/:id/:token",
    "title": "Exchange a (second) temporary token acquired along with a system ID (post record collection based upon NHS number) for a full password and thus access to the UI and chat. Patient signup protocol step 3.",
    "name": "GetPassword",
    "group": "Register",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>System ID supplied in exachange for first token supplied upon prvovision of NHS number.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Token supplied upon issue of system ID.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Confirmation",
            "description": "<p>of ID and newly generated password.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./routes/patient.js",
    "groupTitle": "Register"
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
    "group": "_home_martin_Dropbox_University_Postdoctoral_Associate_2018_19_Research_CONSULT_Architecture_dev_message_passer_docs_main_js",
    "groupTitle": "_home_martin_Dropbox_University_Postdoctoral_Associate_2018_19_Research_CONSULT_Architecture_dev_message_passer_docs_main_js",
    "name": ""
  }
] });
