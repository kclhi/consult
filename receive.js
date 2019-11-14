const amqp = require('amqplib');
const async = require('async');
const logger = require('./config/winston');
require('dotenv').config()
const config = require('config');

const utils = require('./lib/utils');
const fhir = require('./lib/fhir');

function init() {

  amqp.connect('amqp://' + config.get('message_queue.HOST')).then(function(connection) {

    process.once('SIGINT', function() { connection.close(); });

    return async.eachSeries(config.get('message_queue.QUEUES'), function(queue, callback) {

      connection.createChannel().then(function(channel) {

        // Only consume one message from the queue at a time. After resource created and ack sent, next is consumed.
        var ok = channel.prefetch(1);

        ok = ok.then(() => channel.assertQueue(queue));

        ok = ok.then(function(queueOk) {

          return channel.consume(queue, function(message) {

            jsonMessage = JSON.parse(message.content.toString());

            fhir.createObservationResource(config.get('fhir_server.URL'), config.get('fhir_server.REST_ENDPOINT'), jsonMessage.reading, jsonMessage, function(statusCode) {

              if ( statusCode < 300 ) {

                logger.debug("Created new observation resource with status: " + statusCode)
                return channel.ack(message);

              } else {

                logger.debug("Unexpected status code when trying to create observation resource: " + statusCode);log
                return Promise.resolve(statusCode);

              }

            }, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

          });

        });

        return ok.then(function(consumeOk) {

          logger.info('Listening to queue ' + queue);
          callback();

        });

      });

    }, function(error) {

      return Promise.resolve(error);

    });

  }).catch(function(error) {

    logger.debug(error);
    return setTimeout(init, 5000);

  });

};

init();
