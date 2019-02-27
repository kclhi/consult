define({ "api": [
  {
    "type": "post",
    "url": "/initiate",
    "title": "Initiate a dialogue with a Mattermost user.",
    "name": "InitiateDialogue",
    "group": "Dialogue",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>Users chat ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "dialogueID",
            "description": "<p>The ID of the dialogue to start.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Dialogue"
  }
] });
