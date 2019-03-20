var express = require('express');
var request = require('request');
var router = express.Router();
var fs = require('fs');
var Handlebars = require('handlebars');

const config = require('../lib/config');

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

function findResponse(receivedMsg, chatContext, callback) {

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
  var dialArr = JSON.parse(fs.readFileSync('dialogues/dialogue.json', 'utf8'));

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
              if ( answer ) {
                  answerButtonsArr.push(
                      {
                          "name": "/" + answer,
                          "integration": {
                              "url": config.MANAGER_URL,
                              "context": {
                                  "command": "/" + answer,
                                  "chatContext": chatContext
                              }
                          }
                      },
                  );
              }
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
                          "url": config.MANAGER_URL,
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

  callback(response, answerButtonsArr);

}

router.post('/response', function(req, res, next) {

    // New chat session.
    if ( !req.body.context || !req.body.context.chatContext ) {

        var chatContext = {};
        chatContext.user = req.body.user_name;
        chatContext.chatId = req.body.user_id;

    // For initiated chats, assign them an ID. Could also be done during the initiation.
    } else if ( !req.body.context.chatContext.chatId ) {

        var chatContext = req.body.context.chatContext;
        chatContext.chatId = req.body.user_id;

    } else  {

        var chatContext = req.body.context.chatContext;

    }

    if ( req.body.command ) {

        var receivedMsg = req.body.command;  // Input from chat server

    } else if ( req.body.context.command ) {

        var receivedMsg = req.body.context.command;

    }

    findResponse(receivedMsg, chatContext, function(response, answerButtonsArr) {

      request.post(config.MATTERMOST_WEBHOOK.replace(config.CHAT_EXTERNAL_URL, config.CHAT_INTERNAL_URL), {
          json: {
              "response_type": "in_channel",
              "username": "stroke-companion",
              "channel": "@" + chatContext.user,
              "attachments": [
                  {
                      "pretext": "",
                      "text": response.Print,
                      "actions": answerButtonsArr
                  }
              ]
          },
          rejectUnauthorized: false,
          requestCert: true
      },
    	function (error, response, body) {

          if (!error && response.statusCode == 200) {

    			     console.log(response.body)

          } else {

               console.log(error)

          }

          res.end();

        });

    });

});

/**
 * @api {post} /initiate Initiate a dialogue with a Mattermost user.
 * @apiName InitiateDialogue
 * @apiGroup Dialogue
 *
 * @apiParam {String} username Users chat ID.
 * @apiParam {Number} dialogueID The ID of the dialogue to start.
 * @apiParam {Number} username Users chat ID.
 *
 */
router.post('/initiate', function(req, res, next) {

  var chatContext = {};
  chatContext.user = req.body.username;

  findResponse("/" + req.body.dialogueID, chatContext, function(dialogueResponse, answerButtonsArr) {

    request.post(config.CHAT_INTERNAL_URL + "/api/v4/users/login", {
      json: {
        "login_id":"connie",
        "password":"12345"
      },
      rejectUnauthorized: false,
      requestCert: true
    },
    function (error, response, body) {

      if (!error) {

        request.get(config.CHAT_INTERNAL_URL + "/api/v4/teams", {
          headers: {

           "Authorization": "Bearer " + response.headers.token

          },
          rejectUnauthorized: false,
          requestCert: true
        },
        function (error, teams, body) {

          if (!error) {

            request.get(config.CHAT_INTERNAL_URL + "/api/v4/hooks/incoming", {
              headers: {
                "Authorization": "Bearer " + response.headers.token
              },
              qs: {
                "team_id": teams.body[0].id
              },
              rejectUnauthorized: false,
              requestCert: true
            },
            function (error, response, body) {

              if (!error) {

                request.post((config.CHAT_INTERNAL_URL + "/hooks/" + JSON.parse(response.body)[0].id).replace(config.CHAT_EXTERNAL_URL, config.CHAT_INTERNAL_URL), {
                  json: {
                    "response_type": "in_channel",
                    "username": "connie",
                    "channel": "@" + req.body.username,
                    "attachments": [
                      {
                        "image_url": "https://images-na.ssl-images-amazon.com/images/I/51gG7k4ZdJL._SX425_.jpg",
                        "pretext": "",
                        "text": dialogueResponse.Print,
                        "actions": answerButtonsArr
                      }
                    ]
                  },
                  rejectUnauthorized: false,
                  requestCert: true
                },
                function (error, response, body) {

                  if (!error) {

                    console.log(response.statusCode);

                  } else {

                    console.log(error);

                  }

                  res.end();

                });

              } else {

                console.log(error);

              }

              res.end();

            });

          } else {

            console.log(error);

          }

          res.end();

        });

      } else {

        console.log(error);

      }

      res.end();

    });

  });

});

module.exports = router;
