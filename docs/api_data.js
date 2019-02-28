define({ "api": [
  {
    "type": "post",
    "url": "/convert/bp",
    "title": "Populate a FHIR blood pressure template with the supplied values",
    "name": "ConvertBP",
    "group": "Convert",
    "parameter": {
      "fields": {
        "Parameter": [
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
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Convert"
  },
  {
    "type": "post",
    "url": "/convert/hr",
    "title": "Populate a FHIR heart rate template with the supplied values",
    "name": "ConvertHR",
    "group": "Convert",
    "parameter": {
      "fields": {
        "Parameter": [
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
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Convert"
  }
] });
