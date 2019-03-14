const amqp = require('amqplib');
const async = require('async');

const utils = require('./lib/utils');
const fhir = require('./lib/fhir');
const config = require('./lib/config');

amqp.connect('amqp://' + config.RABBIT_HOST).then(function(connection) {

  process.once('SIGINT', function() { connection.close(); });

  return async.eachSeries(config.RABBIT_QUEUES, function(queue, callback) {

    connection.createChannel().then(function(channel) {

      // Only consume one message from the queue at a time. After resource created and ack sent, next is consumed.
      var ok = channel.prefetch(1);

      ok = ok.then(() => channel.assertQueue(queue));

      ok = ok.then(function(queueOk) {

        return channel.consume(queue, function(message) {

          jsonMessage = JSON.parse(message.content.toString());

          fhir.createFHIRResource(jsonMessage.reading, jsonMessage, function(statusCode) {

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

}).catch(console.warn);
