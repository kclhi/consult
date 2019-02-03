var express = require('express');
var request = require('request');
var router = express.Router();
var fs = require('fs');
var Handlebars= require('handlebars');

const dncURL = "http://localhost:3001";

Handlebars.registerHelper('p1u1stepsHome', function() { return '23095'; });
Handlebars.registerHelper('p1u1stepsPercTotal', function() { return '65'; });
Handlebars.registerHelper('p1u2stepsPercTotal', function() { return '80'; });
Handlebars.registerHelper('p1u3stepsPercTotal', function() { return '93'; });
Handlebars.registerHelper('p1u4stepsHome', function() { return '22828'; });
Handlebars.registerHelper('p1u4stepsPercTotalA', function() { return '65'; });
Handlebars.registerHelper('p1u4stepsPercTotalB', function() { return '80'; });
Handlebars.registerHelper('p1s1stepsPercTotal', function() { return '93'; });
Handlebars.registerHelper('p1saTemp', function() { return '1.1'; });
Handlebars.registerHelper('p1sbStepsPercTotal12', function() { return '93'; });
Handlebars.registerHelper('p1sbStepsPercTotal8', function() { return '64'; });
Handlebars.registerHelper('p1sbTemp', function() { return '0.9'; });

function tmplRpl(s) { // Replace template placeholders
    return Handlebars.compile(s)();
}

router.post('/', function(req, res, next) {

    // New chat session
    if ( req.body.response_url ) {

        var chatContext = {}
        chatContext.responseUrl = req.body.response_url;
        chatContext.chatId = req.body.user_id;

    } else {

        var chatContext = req.body.context.chatContext;

    }

    if ( req.body.command ) {

        var receivedMsg = req.body.command;  // Input from Telegram

    } else if ( req.body.context.command ) {

        var receivedMsg = req.body.context.command;

    }

    var newDialNo  // = msg.payload.newDialNo // Triggered by upstream node if new dialogue
    // ?? How does this overwrite if there is an old dialogue going on? Delete old dialogue, let it finish? Extra button to cancel it?
    var response = {}; // Response object
    var answerButtonsArr = [];
    var error = 0;
    var processUserMessage = true;

    // Read context from possible previous conversation
    var ctx = {} // Message parameter for Chat Context
    var chat = chatContext // RedBot chat context
    ctx.lastMsgDialNo = chatContext.lastMsgDialNo
    ctx.lastMsgStepNo = chatContext.lastMsgStepNo
    ctx.lastMsgTs     = chatContext.lastMsgTs // To delete old chat session later
    ctx.chatId        = chatContext.chatId

    // Delete old session (> 10 min = 600 s)
    if (Math.round(+new Date()/1000) - ctx.lastMsgTs > 600) {
        chat = {};
    }

    // Load scripted dialoges as array of JSON objects
    var dialArr = JSON.parse(fs.readFileSync('dialogues.json', 'utf8'));

    if (receivedMsg.trim() == '/start')  { // hard-code specfic dialogue for demo
        // receivedMsg = '/1';
    }

    if (receivedMsg.trim().startsWith("/") ) { // is command
        var cmd = receivedMsg.trim();
        var dialIds = Array.from(new Set( dialArr.map(a => a.Dialogue) )).sort() // get unique set of Dialogue IDs

        switch (cmd) {
        case '/start': // Hard-coded menu
        case '/starttest':
            // send keyboard with all options
            response.Print = "Hi, how can I help you? Please select from the buttons further below which dialogue you want to start.";

            for (const answer of dialIds) {
                answerButtonsArr.push(
                    {
                        "name": "/" + answer,
                        "integration": {
                            "url": dncURL,
                            "context": {
                                "command": "/" + answer,
                                "chatContext": chatContext
                            }
                        }
                    },
                );
            }
            processUserMessage = false;
            break;

        case '/help': // Send short summary
            response.Print = "Show menu with /start command."
            processUserMessage = false;
            break;

        default:
            const id = cmd.replace('/','') ;
            if ( dialIds.indexOf(id) >= 0 ) // keyboard command is valid dialogue ID
            {
                newDialNo = id; // Start new dialogue with this id
            }
            else { // an unknown command
                response.Print = "Sorry, I don't know this command. Please use /start to begin a conversation."
                processUserMessage = false;
            }
        }
    }
    else { // Msg is not a command
        // Just continue and treat as normal dialogue (??)
    }

    if (processUserMessage) { // user input is processed (not if it was command)

        // if ( ctx.lastMsgDialNo ) // ## This was checked in RULES node. Need to check here??
        dialNo = ctx.lastMsgDialNo; // if undefined ...??
        stepNo = ctx.lastMsgStepNo; // if undefined ...??

        // Filter steps for selected dialogue ID
        dialArr = dialArr.filter(i => i.Dialogue === (newDialNo ? newDialNo : dialNo ))

        if (newDialNo) { // Is this a brand new dialogue?
            dialNo = newDialNo;     // Overwriting possible Context setting. New dialogue taking precedence. Do we want that??
            stepNo = 1; // Start at the beginning
        }
        else { // Handle user response to previous message. Find previous script step
            var idx = dialArr.findIndex(i => i.Step == stepNo); // If undefined ...
            if (idx >= 0 ) { // this was the previous step
                var condjmpArr = dialArr[idx].CondJmp // If undefined ...
                idx = condjmpArr.findIndex(i => ( tmplRpl(i.msg) == receivedMsg ) );
                if (idx >= 0 ) {
                    stepNo = condjmpArr[idx].n // Process next step // If undefined ...
                } // else stepNo is unchanged. Will repeat previous message automatically.
            }
            else {
                response.Print = "Hmm, looks like the previous dialogue step has disappeared. Have to wrap up this conversation, unfortunately. Good bye!";
                error = 1; // END
            }
        }

        // Find response to message
        var idx = dialArr.findIndex(i => i.Step == stepNo); // If undefined ...

        if (idx >= 0 ) { //  entry found
            var msgRow       = dialArr[idx] //
            var condjmpArr   = msgRow.CondJmp // If undefined ...
            response.Answers = condjmpArr.map(a => tmplRpl(a.msg) ); // Array of available answers
            // response.Print   = Handlebars.compile(msgRow.Print)(); // Compile tags in msg
            console.log(response);
            response.Print   = tmplRpl(msgRow.Print); // Compile tags in msg
            response.Media   = msgRow.Media;
            response.Action  = msgRow.Action;

        }
        else { // Jump to unknown dialogue step. Terminate.
            response.Print = "Oops, I cannot find a response. Have to wrap up this conversation, unfortunately. Good bye!";
            error = 1; // END
        }

        // Last response of dialogue?
        if (error === 1 || (condjmpArr.length === 1 && parseInt(condjmpArr[0].n) === 0) ) {
            chat = {}    // Delete chat context, end of dialogue.
        }
        else { // Prepare next step of dialogue flow
            // Update chat Context
            chat.lastMsgDialNo = dialNo
            chat.lastMsgStepNo = stepNo
            chat.lastMsgTs = Math.round(+new Date()/1000) // Timestamp

            for (const answer of response.Answers) {

                answerButtonsArr.push(
                    {
                        "name": answer,
                        "integration": {
                            "url": dncURL,
                            "context": {
                                "command": answer,
                                "chatContext": chatContext
                            }
                        }
                    },
                );

            }

        }

    }

    request.post(chatContext.responseUrl.replace("https://consult.hscr.kcl.ac.uk", "http://localhost:8065"), {
        json: {
    	      "response_type": "in_channel",
            "attachments": [
                {
                    "pretext": "",
                    "text": response.Print,
                    "actions": answerButtonsArr
                }
            ]
        },
    },
  	function (error, response, body) {

        if (!error && response.statusCode == 200) {

  			     console.log(response.body)

        } else {

             console.log(error)

        }

        res.end();

    }

  );

});

module.exports = router;
