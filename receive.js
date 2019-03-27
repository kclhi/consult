const amqp = require('amqplib');
const async = require('async');
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

                return channel.ack(message);

              } else {

                return Promise.resolve(statusCode);

              }

            });

          });

        });

        return ok.then(function(consumeOk) {

          console.log('Listening to queue ' + queue);
          callback();

        });

      });

    }, function(err) {

      return Promise.resolve(err);

    });

  }).catch(function(error) {

    console.log(error);
    return setTimeout(init, 5000);

  });

};

init();
