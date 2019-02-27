define({ "api": [
  {
    "type": "get",
    "url": "/garmin/register/:patientId",
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
    "filename": "routes/register.js",
    "groupTitle": "Register"
  }
] });
