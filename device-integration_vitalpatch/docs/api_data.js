define({ "api": [
  {
    "type": "get",
    "url": "/register/:patientId/:patchId",
    "title": "Register a patient ID against a device.",
    "name": "registerPatient",
    "group": "Register",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "patientId",
            "description": "<p>The ID associated with a patient, and their data, within the system.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "patchId",
            "description": "<p>The ID listed on a vitalpatch</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./routes/register.js",
    "groupTitle": "Register"
  },
  {
    "type": "get",
    "url": "/simulate/incomingECG/:patientID/:practitionerID",
    "title": "Grab simulated ECG data from vital patch API and push through system.",
    "name": "simulateECG",
    "group": "Simulate",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "patientID",
            "description": "<p>Patient unique ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "practitionerID",
            "description": "<p>Practitioner unique ID.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./routes/simulate.js",
    "groupTitle": "Simulate"
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
    "group": "_home_martin_Dropbox_University_Postdoctoral_Associate_2018_19_Research_CONSULT_Sensor_dev_device_integration_vitalpatch_docs_main_js",
    "groupTitle": "_home_martin_Dropbox_University_Postdoctoral_Associate_2018_19_Research_CONSULT_Sensor_dev_device_integration_vitalpatch_docs_main_js",
    "name": ""
  }
] });
