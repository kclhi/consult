define({ "api": [
  {
    "type": "get",
    "url": "/register/:patientId",
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
    "url": "/simulate/incomingHR",
    "title": "Simulate a set of incoming (separate from BP) heart rate values.",
    "name": "simulateHR",
    "group": "Simulate",
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
    "group": "_home_martin_Dropbox_University_Postdoctoral_Associate_2017_18_Research_CONSULT_Sensor_dev_device_integration_garmin_docs_main_js",
    "groupTitle": "_home_martin_Dropbox_University_Postdoctoral_Associate_2017_18_Research_CONSULT_Sensor_dev_device_integration_garmin_docs_main_js",
    "name": ""
  }
] });
