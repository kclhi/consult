define({ "api": [
  {
    "type": "post",
    "url": "/create/bp",
    "title": "Populate a FHIR blood pressure template with the supplied values",
    "name": "CreateBP",
    "group": "Create",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>Unique ID of this reading.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "271649006",
            "description": "<p>Systolic blood pressure value.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "271650006",
            "description": "<p>Diastolic blood pressure value.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "8867-4",
            "description": "<p>Heart rate value.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "subjectReference",
            "description": "<p>ID of the patient to which this reading pertains.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "practitionerReference",
            "description": "<p>ID of the practitioner to whom the patient to which this reading pertains is assigned.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./routes/index.js",
    "groupTitle": "Create"
  },
  {
    "type": "post",
    "url": "/create/ecg",
    "title": "Populate a FHIR ECG template with the supplied values",
    "name": "CreateECG",
    "group": "Create",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>Unique ID of this reading.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "data",
            "description": "<p>ECG data.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "subjectReference",
            "description": "<p>ID of the patient to which this reading pertains.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "practitionerReference",
            "description": "<p>ID of the practitioner to whom the patient to which this reading pertains is assigned.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./routes/index.js",
    "groupTitle": "Create"
  },
  {
    "type": "post",
    "url": "/create/hr",
    "title": "Populate a FHIR heart rate template with the supplied values",
    "name": "CreateHR",
    "group": "Create",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>Unique ID of this reading.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "averageHeartRateInBeatsPerMinute",
            "description": "<p>Heart rate value.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "subjectReference",
            "description": "<p>ID of the patient to which this reading pertains.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "practitionerReference",
            "description": "<p>ID of the practitioner to whom the patient to which this reading pertains is assigned.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./routes/index.js",
    "groupTitle": "Create"
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
    "group": "_home_martin_Dropbox_University_Postdoctoral_Associate_2018_19_Research_CONSULT_Architecture_dev_sensor_fhir_mapper_docs_main_js",
    "groupTitle": "_home_martin_Dropbox_University_Postdoctoral_Associate_2018_19_Research_CONSULT_Architecture_dev_sensor_fhir_mapper_docs_main_js",
    "name": ""
  }
] });
