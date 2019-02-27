define({ "api": [
  {
    "type": "get",
    "url": "/:patientID/:code/:start/:end",
    "title": "Request User information",
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
    "filename": "routes/observation.js",
    "groupTitle": "Observations"
  }
] });
