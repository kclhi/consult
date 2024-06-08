import pika, configparser, json, os
from FHIR.utilities import Utilities;

def init():

    while(True):

        try:

            config = configparser.ConfigParser();
            config.read('config/config.prod.ini');
            connection = pika.BlockingConnection(pika.ConnectionParameters(config['MESSAGE_QUEUE']['HOST']));
            channel = connection.channel();
            channel.basic_qos(0, 1);
            channel.queue_declare(queue=config['MESSAGE_QUEUE']['NAME'], durable=True);

            def callback(channel, method, properties, body):

                body = body.decode("utf-8");
                jsonBody = json.loads(body);

                response = Utilities.createFHIRResource(jsonBody['resource'], body);

                # Because we may have repeat IDs for subscriptions and practitioners as a part of a simulation.
                if ( response == 200 or ( response == 400 and ( ( jsonBody['resource'] == "Subscription" or jsonBody['resource'] == "Practitioner" ) ) ) ):
                    channel.basic_ack(method.delivery_tag);
                else:
                    print("Error adding FHIR resource: " + str(response));

            channel.basic_consume(config['MESSAGE_QUEUE']['NAME'], callback);

            try:
                channel.start_consuming();

            except KeyboardInterrupt:
                channel.stop_consuming();
                connection.close()
                break;

        except pika.exceptions.ConnectionClosedByBroker:
            # Uncomment this to make the example not attempt recovery
            # from server-initiated connection closure, including
            # when the node is stopped cleanly
            #
            # break
            continue;

        # Do not recover on channel errors
        except pika.exceptions.AMQPChannelError as err:
            print("Caught a channel error: {}, stopping...".format(err));
            break;

        # Recover on all other connection errors
        except pika.exceptions.AMQPConnectionError:
            print("Connection was closed, retrying...");
            continue;

if __name__ == '__main__':
    init();
