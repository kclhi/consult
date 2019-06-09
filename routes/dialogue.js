const express = require('express');
const request = require('request');
const router = express.Router();
const logger = require('../config/winston');
const fs = require('fs');
const async = require('async');
const Handlebars = require('handlebars');
const config = require('config');

const mattermost = require('../lib/mattermost');
const utils = require('../lib/utils');

const connieAvatar = "connie.jpg"

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

let webhook = config.get('mattermost.WEBHOOK');

function getWebhook(callback) {

  if ( webhook ) {

    callback(webhook);

  } else {

    mattermost.login(function(token) {

      if ( token ) {

        mattermost.getTeamID(token, function(team) {

          if ( team ) {

            request.get(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/hooks/incoming", {

              headers: {
                "Authorization": "Bearer " + token
              },
              qs: {
                "team_id": team
              },
              requestCert: true

            },
            function (error, response, body) {

              if ( !error && ( response && response.statusCode < 400 ) && ( id = ( body && JSON.parse(body)[0].id ? JSON.parse(body)[0].id : false ) ) ) {

                webhook = config.get('mattermost.CHAT_INTERNAL_URL') + "/hooks/" + id;
                callback( webhook );

              } else {

                logger.error("Error getting webhook: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(body) : "" ) );

              }

            });

          } else {

            logger.error("Got null value for team.")

          }

        });

      } else {

        logger.error("Got null value for token.")

      }

    });

  }

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
  var dialArr = [];

  fs.readdir("dialogues/" + ( config.get('dialogue_manager.STATIC') ? "static/" : "" ), function(err, filenames) {

    if (err) {

      logger.error("Could not load JS scripts.")
      return;

    }

    filenames.forEach(function(filename) {

      if ( filename.indexOf(".json") > -1 ) {

        dialArr = dialArr.concat(JSON.parse(fs.readFileSync('dialogues/' + ( config.get('dialogue_manager.STATIC') ? "static/" : "" ) + filename, 'utf8')));

      }

    });

    logger.info("Loaded " + dialArr.length + " responses.");

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
        response.Print = "How can I help you? Please select from the buttons below to start.";

        for (const answer of dialIds) {
          if ( answer ) {
            answerButtonsArr.push({
              "name": "/" + answer,
              "integration": {
                "url": config.get('dialogue_manager.URL') + "/response",
                "context": {
                  "command": "/" + answer,
                  "chatContext": chatContext
                }
              }
            });
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

        var msgRow;
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
            msgRow       = dialArr[idx] //
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
                            "url": config.get('dialogue_manager.URL') + "/response",
                            "context": {
                                "command": answer,
                                "chatContext": chatContext
                            }
                        }
                    },
                );

            }

        }

        // Dynamic chat response logic.

        // Replace content of chat response with content in dialogueParams context variable.
        if ( chat.dialogueParams ) {

          Object.keys(chat.dialogueParams).forEach(function(key) {

            response.Print = response.Print.replace("[" + key + "]", chat.dialogueParams[key]);

          });

        }

        // Does our print response require information from an external source?
        if ( msgRow && msgRow.External ) {

          logger.debug("Response is external");

          // Do we need to create anything for the body of this external call?
          if ( msgRow.External.Body ) {

            logger.debug("Response requires body components. Gathering...");
            externalCallBody = {};

            // Look at each item specified for the body of this external call.
            async.eachSeries(Object.keys(msgRow.External.Body), function(item, next) {

              item = msgRow.External.Body[item];

              // Get value for body from chat context
              if ( item.Value.Type == "context" ) {

                logger.debug("Context body item: " + JSON.stringify(item));

                if ( chatContext[item.Value.Key] ) {

                  externalCallBody[item.Key] = chatContext[item.Value.Key];
                  logger.debug("Added externalCallBody entry for " +  item.Key);

                } else {

                  logger.error("Could not find requested chat context item: " + item.Value.Key);
                  callback(null, null);

                }

                next();

              // Get value for body from another external call
              } else if ( item.Value.Type == "external" ) {

                logger.debug("External body item: " + JSON.stringify(item));

                var URL = item.Value.URL;

                // Do we need to add anything to the URL of this nested external call, required to populate the body.
                if ( item.Value.Path ) {

                  logger.debug("Adding to URL...");

                  Object.keys(item.Value.Path).forEach(function(pathItem) {

                    pathItem = item.Value.Path[pathItem];

                    // If the item to add to the path of the nested external call comes from the chat context, add it.
                    if ( pathItem.Type == "context" ) {

                      logger.debug("Trying to resolve context item: " + pathItem.Key);

                      if ( chatContext[pathItem.Key] ) {

                        logger.debug("Adding to the path of nested external call to populate body.");
                        URL += "/" + chatContext[pathItem.Key];

                      } else {

                        logger.error("Could not find requested chat context item: " + pathItem.Key);
                        callback(null, null);

                      }

                    }

                  });

                }

                externalCallNestedRequestBody = {};

                // Do we need to add anything to the request body of this nested external call, required to populate the body.
                // ~MDC some repetition here, so recursion may be viable.
                if ( item.Value.Body ) {

                  // Look at each item specified for the body of this nested external call.
                  Object.keys(item.Value.Body).forEach(function(bodyItem) {

                    bodyItem = item.Value.Body[bodyItem];
                    logger.debug("Nested external call body item: " + JSON.stringify(bodyItem));

                    // If the item to add to the request body of the nested external call comes from the chat context, add it.
                    if ( bodyItem.Value.Type == "context" ) {

                      logger.debug("Trying to resolve context item: " + bodyItem.Value.Key);

                      if ( chatContext[bodyItem.Value.Key] ) {

                        externalCallNestedRequestBody[bodyItem.Key] = chatContext[bodyItem.Value.Key];
                        logger.debug("Added externalCallNestedRequestBody entry for " + bodyItem.Key);

                      } else {

                        logger.error("Could not find requested chat context item: " + pathItem.Value.Key);
                        callback(null, null);

                      }

                    } else if ( bodyItem.Value.Type == "literal" ) {

                      externalCallNestedRequestBody[bodyItem.Key] = bodyItem.Value.Value;
                      logger.debug("Added externalCallNestedRequestBody entry for " + bodyItem.Key);

                    }

                  });

                }

                // Make external call to populate body item.
                request({

                  url: URL,
                  method: item.Value.Method,
                  json: externalCallNestedRequestBody

                }, function (error, response, body) {

                  if ( error || (response && response.statusCode >= 400) || !body ) {

                    logger.error("Failed to populate body item with external call: " + ( error ? error : "" ) + " Status: " + ( response && response.statusCode ? response.statusCode : "Status code unknown" ));
                    callback(null, null);

                  } else {

                    if ( parsedBody = utils.JSONParseWrapper(body) ) {

                      externalCallBody[item.Key] = parsedBody;

                    } else {

                      externalCallBody[item.Key] = body;

                    }

                    logger.debug("Added externalCallBody entry for " + item.Key);
                    next();

                  }

                });

              // Item to add to body is a simple literal
              } else if ( item.Value.Type = "literal" ) {

                logger.debug("Literal body item: " + JSON.stringify(item));

                externalCallBody[item.Key] = item.Value.Value;
                logger.debug("Added externalCallBody entry for " + item.Key);
                next();

              }

            }, function(bodyConstructionError) {

              logger.debug("Full body for external call ready.");

              // Make external call and replace printed response with returned value after external call body populated.
              externalURLResponse(msgRow, response, externalCallBody, function(response) {

                callback(response, answerButtonsArr);

              });

            });

          } else {

            // Make external call and replace printed response with returned value without call body.
            externalURLResponse(msgRow, response, {}, function(response) {

              callback(response, answerButtonsArr);

            });

          }

        } else {

          // Return printed response unchanged.
          callback(response, answerButtonsArr);

        }

    } else {

      callback(response, answerButtonsArr);

    }

  });

}

function externalURLResponse(msgRow, messageResponse, externalCallBody, callback) {

  // Main external call.
  request({

    url: msgRow.External.URL,
    method: msgRow.External.Method,
    json: externalCallBody

  }, function (error, response, body) {

    if ( error || (response && response.statusCode >= 400) || !body ) {

      logger.error("Failed to call external source (" + msgRow.External.URL + ") for dynamic print return. Error: " + ( error ? error : "No error given" ) + ". Status: " + ( response && response.statusCode ? response.statusCode : "Status code unknown" ) + ". Body: " + ( ( body && typeof body === "object" ) ? JSON.stringify(body) : "No return body." ));
      callback(null);

    } else {

      logger.debug("Received from external source for dynamic print return: " + JSON.stringify(body));

      if ( parsedBody = utils.JSONParseWrapper(body) ) {

        utils.keyify(parsedBody).forEach(function(key) {

          logger.debug("Replacing [" + key + "] with " + utils.resolve(key, parsedBody));
          // Double brackets are optionals. Replace these first.
          messageResponse.Print = messageResponse.Print.replace("[[" + key + "]]", utils.resolve(key, parsedBody));
          messageResponse.Print = messageResponse.Print.replace("[" + key + "]", utils.resolve(key, parsedBody));

        });

        // Any optionals left are removed.
        messageResponse.Print = utils.replaceAll(messageResponse.Print, "\\[\\[.*\\]\\]", "");

      }

      callback(messageResponse);

    }

  });

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

    // Don't allow template responses to go back to user.
    if ( !response || ( response && response.Print.indexOf("[") >= 0 ) || !answerButtonsArr ) {

      response = {};
      response.Print = "Sorry, we aren't able to process a response for you right now.";
      answerButtonsArr = [];

    }

    getWebhook(function(webhook) {

      request.post(webhook.replace(config.get('mattermost.CHAT_EXTERNAL_URL'), config.get('mattermost.CHAT_INTERNAL_URL')), {

        json: {
          "response_type": "in_channel",
          "username": "connie",
          "channel": "@" + chatContext.user,
          "icon_url": config.get('dialogue_manager.URL') + "/" + connieAvatar,
          "attachments": [
            {
              "pretext": "",
              "text": response.Print,
              "actions": answerButtonsArr
            }
          ]
        },
        requestCert: true

      },
    	function (error, response, body) {

        if (error || ( response && response.statusCode >= 400 )) {

  		     logger.error("Error responding to dialogue message: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + ( response && response.body && typeof response.body === "object" ? JSON.stringify(response.body) : "" ));
           res.end();

        } else {

          // Needs to just 'end' rather than send status, as otherwise displayed as extra message by Mattermost.
          res.end();

        }

      });

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
  chatContext.dialogueParams = req.body.dialogueParams;

  findResponse("/" + req.body.dialogueID, chatContext, function(dialogueResponse, answerButtonsArr) {

    if ( dialogueResponse && dialogueResponse.Print && answerButtonsArr ) {

      getWebhook(function(webhook) {

        if ( webhook ) {

          webhook.replace(config.get('mattermost.CHAT_EXTERNAL_URL'), config.get('mattermost.CHAT_INTERNAL_URL'));

          request.post(webhook, {

            json: {
              "response_type": "in_channel",
              "username": "connie",
              "channel": "@" + req.body.username,
              "icon_url": config.get('dialogue_manager.URL') + "/" + connieAvatar,
              "attachments": [
                {
                  "image_url": config.get('dialogue_manager.URL') + "/warning.jpg",
                  "pretext": "",
                  "text": dialogueResponse.Print,
                  "actions": answerButtonsArr
                }
              ]
            },
            requestCert: true

          },
          function (error, response, body) {

            if (error || ( response && response.statusCode >= 400 )) {

              logger.error("Error initiating dialogue: " + ( webhook ? webhook : "" ) + error + " " + ( response && response && response.statusCode ? response.statusCode : "" ) + ( response && response.body && typeof response.body === "object" ? JSON.stringify(response.body) : "" ));
              res.sendStatus(400);

            } else {

              logger.info("Dialogue initiated: " + webhook + " " + req.body.username + " " + ( typeof dialogueResponse.Print === "object" ? JSON.stringify(dialogueResponse.Print) : dialogueResponse.Print )  + " " + ( typeof answerButtonsArr === "object" ? JSON.stringify(answerButtonsArr) : answerButtonsArr ));
              res.sendStatus(200);

            }

          });

        } else {

          logger.error("Failed to get webhook: " + webhook);
          res.sendStatus(400);

        }

      });

    } else {

      logger.error("Failed to get dialogue response: " + (dialogueResponse && typeof dialogueResponse === "object" ? JSON.stringify(dialogueResponse) : dialogueResponse) + " " + answerButtonsArr.toString());
      res.sendStatus(400);

    }

  });

});

module.exports = router;
