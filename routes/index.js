var express = require('express');
var request = require('request');
var router = express.Router();

const dncURL = "http://localhost:3001";

router.post('/', function(req, res, next) {
    
	console.log(req.body);

    request.post(req.body.response_url.replace("https://consult.hscr.kcl.ac.uk", "http://localhost:8065"), {
        json: {
    	      "response_type": "in_channel",
            "attachments": [
            {
                "pretext": "This is the attachment pretext.",
                "text": "This is the attachment text.",
                "actions": [
                {
                    "name": "Ephemeral Message",
                    "integration": {
                        "url": dncURL,
                        "context": {
                            "action": "do_something_ephemeral"
                        }
                    }
                },
                {
                    "name": "Update",
                    "integration": {
                        "url": dncURL,
                        "context": {
                            "action": "do_something_update"
                        }
                    }
                }
                ]
            }
            ]
        },
    },
  	function (error, response, body) {

        console.log(response.statusCode);

        if (!error && response.statusCode == 200) {

  			     console.log(body)

        } else {

             console.log(error)

        }

        res.end();

    }

  );

});

module.exports = router;
