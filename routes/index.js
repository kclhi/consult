var express = require('express');
var request = require('request');
var router = express.Router();

const dncURL = "http://localhost:3001";

router.post('/', function(req, res, next) {

    // New chat session
    if ( req.body.response_url ) {

        var chatContext = {}
        chatContext.responseUrl = req.body.response_url;

    } else {

        var chatContext = req.body.context.chatContext;

    }

    request.post(chatContext.responseUrl.replace("https://consult.hscr.kcl.ac.uk", "http://localhost:8065"), {
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
                            "action": "do_something_ephemeral",
                            "chatContext": chatContext
                        }
                    }
                },
                {
                    "name": "Update",
                    "integration": {
                        "url": dncURL,
                        "context": {
                            "action": "do_something_update",
                            "chatContext": chatContext
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
