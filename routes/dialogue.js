const express = require('express');
const request = require('request');
const router = express.Router();
const logger = require('../config/winston');
const fs = require('fs');
const async = require('async');
const config = require('config');
const uuidv1 = require('uuid/v1');

const mattermost = require('../lib/mattermost');
const utils = require('../lib/utils');

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

function findResponse(receivedMsg, chatContext, dev, callback) {

  var newDialNo // Kai: Triggered by upstream node if new dialogue
  // Kai: ?? How does this overwrite if there is an old dialogue going on? Delete old dialogue, let it finish? Extra button to cancel it?
  var response = {}; // Kai: Response object
  var answerButtonsArr = [];
  var error = 0;
  var processUserMessage = true;

  // Kai: Read context from possible previous conversation
  var ctx = {} // Kai: Message parameter for Chat Context
  var chat = chatContext // Kai: RedBot chat context
  ctx.lastMsgDialNo = chatContext.lastMsgDialNo
  ctx.lastMsgStepNo = chatContext.lastMsgStepNo
  ctx.lastMsgTs     = chatContext.lastMsgTs // Kai: To delete old chat session later
  ctx.chatId        = chatContext.chatId

  // Kai: Delete old session (> 10 min = 600 s)
  if ( Math.round( +new Date() / 1000 ) - ctx.lastMsgTs > 600 ) {

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

    if ( receivedMsg.trim().startsWith("/") ) { // Kai: is command

      var cmd = receivedMsg.trim();
      var dialIds = Array.from(new Set( dialArr.map(a => a.Dialogue) )).sort() // Kai: get unique set of Dialogue IDs

      switch ( cmd ) {

        case '/' + config.get('chatbot.COMMAND'): // Kai: Hard-coded menu

          // Kai: send keyboard with all options
          response.Print = "How can I help you? Please select from the buttons below to start.";

          for ( const answer of dialIds ) {

            if ( answer && answer.indexOf("initiate") < 0 ) {

              answerButtonsArr.push({
                "name": utils.replaceAll(answer, "-", " "),
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

        case '/help': // Kai: Send short summary

          response.Print = "Show menu with /start command."
          processUserMessage = false;
          break;

        default:

          const id = cmd.replace('/','');

          if ( dialIds.indexOf(id) >= 0 ) { // Kai: keyboard command is valid dialogue ID

            newDialNo = id; // Kai: Start new dialogue with this id

          } else { // Kai: an unknown command

            response.Print = "Sorry, I don't know this command. Please use /start to begin a conversation."
            processUserMessage = false;

          }

      }

    } else { // Kai: Msg is not a command

      // Kai: Just continue and treat as normal dialogue (??)

    }

    if ( processUserMessage ) { // Kai: user input is processed (not if it was command)

      var msgRow;
      // Kai: ctx.lastMsgDialNo - This was checked in RULES node. Need to check here??
      dialNo = ctx.lastMsgDialNo; // Kai: if undefined ...??
      stepNo = ctx.lastMsgStepNo; // Kai: if undefined ...??
      multi = false;

      // Kai: Filter steps for selected dialogue ID
      dialArr = dialArr.filter(i => i.Dialogue === (newDialNo ? newDialNo : dialNo))

      if ( newDialNo ) { // Kai: Is this a brand new dialogue?

          dialNo = newDialNo; // Kai: Overwriting possible Context setting. New dialogue taking precedence. Do we want that??
          stepNo = 1; // Kai: Start at the beginning
          addResponseAnswers(receivedMsg, chatContext, chat, response, msgRow, multi, error, answerButtonsArr, dialArr, dialNo, stepNo, dev, callback);

      } else { // Kai: Handle user response to previous message. Find previous script step

        var idx = dialArr.findIndex(i => i.Step == stepNo); // Kai: If undefined ...

        if ( idx >= 0 ) { // Kai: this was the previous step

          var condjmpArr = dialArr[idx].CondJmp // Kai: If undefined ...

          addExternalAnswers(condjmpArr, chatContext, dev, function(condjmpArr) { // Need to add dynamic answers prior to next command which searches for ID of last response.

            idx = condjmpArr.findIndex(i => (i.msg == receivedMsg));

            if ( idx >= 0 ) {

              if ( condjmpArr[idx].multi ) { // The selected option is potentially selected along with other options.

                multi = true; // Flag this for later

                if (!chatContext.dialogueParams) chatContext.dialogueParams = {};

                if (!chatContext.dialogueParams.responses) chatContext.dialogueParams.responses = {};

                if (!chatContext.dialogueParams.responses.all) chatContext.dialogueParams.responses.all = [];

                chatContext.dialogueParams.responses.all.push(receivedMsg); // Store this response (to be potentially held along with others) in a context array.
                var options;

                if ( ( options = condjmpArr.filter(a => a.multi == "true" && !chatContext.dialogueParams.responses.all.includes(a.msg)).map(a => a.msg) ) && options.toString().length > 0 ) { // TODO: Remove toString. Determine why filtered arrays are still of size 1.

                  response.Print = "Thank you. Do any of the other options apply?" // Next ouput should ask the user if they wish to select anything else
                  response.Answers = options // Options to show are the remaining multiple choice options
                  response.Answers.push("None of them"); // Add the same option 'None of them' as in the original multiple choice question to the request for other multiple choice responses, as if no more responses remain this is logically equivalent to saying no in the first place.

                } else {

                  multi = false;
                  stepNo = condjmpArr[idx].n // Kai: Process next step // If undefined .

                }

              } else {

                stepNo = condjmpArr[idx].n

                if ( condjmpArr[idx].store ) { // Do we want to store the response in a context array?

                  if (!chatContext.dialogueParams) chatContext.dialogueParams = {};

                  if (!chatContext.dialogueParams.responses) chatContext.dialogueParams.responses = {};

                  chatContext.dialogueParams.responses[condjmpArr[idx].id] = receivedMsg;

                }

              }

            } // Kai: else stepNo is unchanged. Will repeat previous message automatically.

            addResponseAnswers(receivedMsg, chatContext, chat, response, msgRow, multi, error, answerButtonsArr, dialArr, dialNo, stepNo, dev, callback);

          });

        } else {

          logger.error("Hmm, looks like the previous dialogue step has disappeared. Have to wrap up this conversation, unfortunately. Good bye!");
          response.Print = config.get('chatbot.ERROR_TEXT');
          error = 1; // Kai: END
          addResponseAnswers(receivedMsg, chatContext, chat, response, msgRow, multi, error, answerButtonsArr, dialArr, dialNo, stepNo, dev, callback);

        }

      }

    } else {

      callback(response, answerButtonsArr);

    }

  });

}

function addResponseAnswers(receivedMsg, chatContext, chat, response, msgRow, mutli, error, answerButtonsArr, dialArr, dialNo, stepNo, dev, callback) {

  // Kai: Find response to message
  var idx = dialArr.findIndex(i => i.Step == stepNo); // Kai: If undefined ...

  if ( idx >= 0 ) { // Kai: entry found

    msgRow = dialArr[idx]
    var condjmpArr = msgRow.CondJmp // Kai: If undefined ...

    addExternalAnswers(condjmpArr, chatContext, dev, function(condjmpArr) {

      if ( !multi ) { // Only add response and answers if not using a dynamically create multiple choice elicitation response.

        response.Print = msgRow.Print; // Kai: Compile tags in msg
        response.Answers = condjmpArr.map(a => a.msg); // Kai: Array of available answers

      }

      response.Media = msgRow.Media;
      response.Action = msgRow.Action;

      createResponse(receivedMsg, chatContext, chat, response, msgRow, multi, error, answerButtonsArr, condjmpArr, dialNo, stepNo, dev, callback);

    });

  } else { // Kai: Jump to unknown dialogue step. Terminate.

    logger.error("Oops, I cannot find a response. Have to wrap up this conversation, unfortunately. Good bye!");
    response.Print = config.get('chatbot.ERROR_TEXT');
    error = 1; // Kai: END
    createResponse(receivedMsg, chatContext, chat, response, msgRow, multi, error, answerButtonsArr, condjmpArr, dialNo, stepNo, dev, callback);

  }

}

function createResponse(receivedMsg, chatContext, chat, response, msgRow, multi, error, answerButtonsArr, condjmpArr, dialNo, stepNo, dev, callback) {

  // Kai: Last response of dialogue?
  if ( error === 1 || ( condjmpArr.length === 1 && parseInt(condjmpArr[0].n) === 0 && !multi ) ) {

    chat = {} // Kai: Delete chat context, end of dialogue.

  } else { // Kai: Prepare next step of dialogue flow

    // Kai: Update chat Context
    chat.lastMsgDialNo = dialNo
    chat.lastMsgStepNo = stepNo
    chat.lastMsgTs = Math.round( +new Date() / 1000 ) // Kai: Timestamp

    for ( const answer of response.Answers ) {

      answerButtonsArr.push({
        "name": answer,
        "integration": {
          "url": config.get('dialogue_manager.URL') + "/response",
          "context": {
            "command": answer,
            "chatContext": chatContext
          }
        }
      });

    }

  }

  // Dynamic chat response logic.

  // Replace content of chat response with content in dialogueParams context variable (e.g. alert readings).
  if ( chatContext.dialogueParams ) {

    Object.keys(chatContext.dialogueParams).forEach(function(key) {

      var dialogueParamsValue = chatContext.dialogueParams[key];

      // If a context variable is an object, (crudly) combine all its values to replace within the chat response.
      if ( (typeof dialogueParamsValue == "object") && !(dialogueParamsValue instanceof Array) ) {

        dialogueParamsValue = Object.keys(dialogueParamsValue).reduce(function(result, value) { return result.concat(dialogueParamsValue[value]); }, []).toString();

      }

      response.Print = response.Print.replace("[" + key + "]", dialogueParamsValue);

    });

  }

  // Does our print response require information from an external source?
  if ( msgRow && msgRow.External ) {

    logger.debug("Response is external");

    externalResponse(msgRow.External, chatContext, response.Print, dev, function(substitutionText) {

      response.Print = substitutionText;
      callback(response, answerButtonsArr);

    });

  } else {

    // Return printed response unchanged.
    callback(response, answerButtonsArr);

  }

}

function addExternalAnswers(answerArray, chatContext, dev, callback) {

  logger.debug("Checking for external answers.");

  async.each(answerArray, function(answer, next) {

    if ( answer.External ) {

      logger.debug("Making external call to populate responses.");

      externalResponse(answer.External, chatContext, answer.substitution, dev, function(substitutionText) {

        logger.debug("Substitution text returned: " + substitutionText);

        if ( substitutionText ) {

          utils.replaceAll(substitutionText, "or ", "").split(" ").forEach(function(msg) {

            var localAnswer = JSON.parse(JSON.stringify(answer)); // Duplicate object.
            delete localAnswer["substitution"]; // Delete template answer information.
            delete localAnswer["External"];
            localAnswer.msg = msg;
            logger.debug("Adding dynamic answer: " + JSON.stringify(localAnswer));
            answerArray.splice(answerArray.indexOf(answer), 0, localAnswer);

          });

        }

        next();

      });

    } else {

      next();

    }

  }, function(externalError) {

    logger.debug("Returning answer array: " + JSON.stringify(answerArray));
    callback(answerArray);

  });

}

function externalResponse(external, chatContext, substitutionText, dev, callback) {

  // Do we need to create anything for the body of this external call?
  if ( external.Body ) {

    logger.debug("Response requires body components. Gathering...");
    externalCallBody = {};

    // Look at each item specified for the body of this external call.
    async.eachSeries(Object.keys(external.Body), function(item, next) {

      item = external.Body[item];

      // Get value for body from chat context
      if ( item.Value.Type == "context" ) {

        logger.debug("Context body item: " + JSON.stringify(item));

        var contextItem;

        // As context items might be JSON subkey specifications (e.g. X.Y), use validPath function to extract.
        if ( contextItem = utils.validPath(chatContext, item.Value.Key.split(".")) ) {

          // If the context item is a JSON object, add each key from that object.
          if ( typeof contextItem === "object" && !contextItem instanceof Array ) {

            Object.keys(contextItem).forEach(function(key) {

              externalCallBody[key] = contextItem[key];
              logger.debug("Added externalCallBody entry for " +  key);

            });

          } else {

            externalCallBody[item.Key] = contextItem.toString();
            logger.debug("Added externalCallBody entry for " +  item.Key);

          }

        } else {

          if ( item.Value.Default ) {

            externalCallBody[item.Key] = item.Value.Default;
            logger.debug("Added default externalCallBody entry for " +  item.Key);

          } else {

            logger.error("Could not find requested chat context item (and no empty replacement): " + item.Value.Key);

          }

        }

        next();

      // Get value for body from another external call
      } else if ( item.Value.Type == "external" ) {

        logger.debug("External body item: " + JSON.stringify(item));

        if ( dev ) {

          var URL = item.Value.devURL;

        } else {

          var URL = item.Value.URL

        }

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
      externalURLResponse(external, substitutionText, externalCallBody, dev, function(substitutionText) {

        callback(substitutionText);

      });

    });

  } else {

    // Make external call and replace printed response with returned value without call body.
    externalURLResponse(external, substitutionText, {}, dev, function(substitutionText) {

      callback(substitutionText);

    });

  }

}

function externalURLResponse(external, substitutionText, externalCallBody, dev, callback) {

  if ( dev ) {

    var URL = external.devURL;

  } else {

    var URL = external.URL;

  }

  // Main external call.
  request({

    url: URL,
    method: external.Method,
    json: externalCallBody

  }, function (error, response, body) {

    if ( error || (response && response.statusCode >= 400) || !body ) {

      logger.error("Failed to call external source (" + URL + ") for dynamic print return. Error: " + ( error ? error : "No error given" ) + ". Status: " + ( response && response.statusCode ? response.statusCode : "Status code unknown" ) + ". Body: " + ( ( body && typeof body === "object" ) ? JSON.stringify(body) : "No return body." ));
      callback(null);

    } else {

      logger.debug("Received from external source for dynamic print return: " + JSON.stringify(body));

      if ( parsedBody = utils.JSONParseWrapper(body) ) {

        // Extract each template item ([...]) from the substitution text. This is the regex to be matched with the external response.
        if ( templateItems = substitutionText.match(new RegExp(config.get("dialogue_manager.TEMPLATE_REGEX"), 'g')) ) {

          for ( let templateItem of templateItems ) { // Traditional FOR for break later.

            logger.debug("Regex extracted from dialogue template: " + templateItem);

            var replacementString = "";

            // Look at each key in the external response.
            utils.keyify(parsedBody).forEach(function(key) {

              // See if that key matches the regex entry (without []) from the substitution text.
              if ( key.match(new RegExp(templateItem.substring(1, templateItem.length - 1), 'g')) ) {

                logger.debug(templateItem + " matches with " + key + " which resolves to " + utils.resolve(key, parsedBody) + ". Storing this to be used as part of the response.")
                // Multiple matches are stored as a list.
                replacementString += ( utils.resolve(key, parsedBody) + " or " );

              }

            });

            if ( replacementString.length > 0 ) {

              logger.debug("Replacing " + templateItem + " with " + replacementString.substring(0, replacementString.length - 4));
              substitutionText = substitutionText.replace(templateItem, replacementString.substring(0, replacementString.length - 4));

            } else {

              // Use script to determine what to do if a template item in a response can't be replaced by the external call.
              if ( external.NoReplacement ) {

                logger.debug("No keys in the external response match. Replacing whole text with specified no response replacement.");
                substitutionText = external.NoReplacement;
                break;

              }

            }

          }

        } else {

          logger.error("No template items found for this response, despite external call: " + substitutionText);

        }

      }

      callback(substitutionText);

    }

  });

}

router.post('/response', function(req, res, next) {

  // New chat session.
  if ( !req.body.context || !req.body.context.chatContext ) {

    var chatContext = {};
    chatContext.user = req.body.user_name;
    chatContext.chatId = uuidv1();

  // For initiated chats, assign them an ID. Could also be done during the initiation.
  } else if ( !req.body.context.chatContext.chatId ) {

    var chatContext = req.body.context.chatContext;
    chatContext.chatId = uuidv1();

  } else  {

    var chatContext = req.body.context.chatContext;

  }

  if ( req.body.command ) {

    var receivedMsg = req.body.command;  // Input from chat server

  } else if ( req.body.context.command ) {

    var receivedMsg = req.body.context.command;

  }

  findResponse(receivedMsg, chatContext, (req.app.get('env') === 'development'), function(response, answerButtonsArr) {

    // Don't allow template responses to go back to user.
    if ( !response || !response.Print || ( response && response.Print.indexOf("[") >= 0 ) || !answerButtonsArr ) {

      response = {};
      response.Print = config.get('chatbot.ERROR_TEXT');
      answerButtonsArr = [];
      logger.debug("Template left in text being sent to user.");

    }

    getWebhook(function(webhook) {

      request.post(webhook.replace(config.get('mattermost.CHAT_EXTERNAL_URL'), config.get('mattermost.CHAT_INTERNAL_URL')), {

        json: {
          "response_type": "in_channel",
          "username": config.get('chatbot.USERNAME'),
          "channel": "@" + chatContext.user,
          "icon_url": config.get('dialogue_manager.URL') + "/" + config.get('chatbot.AVATAR'),
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

  findResponse("/" + req.body.dialogueID, chatContext, (req.app.get('env') === 'development'), function(dialogueResponse, answerButtonsArr) {

    if ( dialogueResponse && dialogueResponse.Print && answerButtonsArr ) {

      getWebhook(function(webhook) {

        if ( webhook ) {

          webhook.replace(config.get('mattermost.CHAT_EXTERNAL_URL'), config.get('mattermost.CHAT_INTERNAL_URL'));

          request.post(webhook, {

            json: {
              "response_type": "in_channel",
              "username": config.get('chatbot.USERNAME'),
              "channel": "@" + req.body.username,
              "icon_url": config.get('dialogue_manager.URL') + "/" + config.get('chatbot.AVATAR'),
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
