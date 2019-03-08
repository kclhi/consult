const amqp = require('amqplib');

const utils = require('./lib/utils');
const fhir = require('./lib/fhir');
const config = require('./lib/config');

amqp.connect('amqp://localhost').then(function(connection) {

  process.once('SIGINT', function() { connection.close(); });

  return connection.createChannel().then(function(channel) {

    var ok = channel.assertQueue(config.RABBIT_QUEUE);

    ok = ok.then(function(queueOk) {

      return channel.consume(config.RABBIT_QUEUE, function(message) {

        jsonMessage = JSON.parse(message.content.toString());

        fhir.createFHIRResource(jsonMessage.reading, jsonMessage, function(statusCode) {

          console.log(statusCode);

          if ( statusCode < 300 ) {

            return channel.ack(message);

          } else {

            return null;

          }

        });

      });

    });

    return ok.then(function(consumeOk) {

      console.log('Listening to queue ' + config.RABBIT_QUEUE);

    });

  });

}).catch(console.warn);
