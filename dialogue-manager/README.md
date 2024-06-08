# Dialogue Manager (dialogue-manager)

Chatbot (currently). Part of the DNC.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Before starting, [download and install python](https://www.python.org/downloads/), [pip](https://packaging.python.org/tutorials/installing-packages/#use-pip-for-installing), [virtualenv](https://virtualenv.pypa.io/en/latest/installation/) and [Node.js](https://nodejs.org/en/download/).

### Other service communication

Receives messages from: message-passer ([install](https://github.kcl.ac.uk/consult/message-passer/blob/native-js/README.md)) ...

Sends messages to: mattermost-server ([install](https://hub.docker.com/r/mattermost/mattermost-preview/)) and argumentation-engine ([install](https://github.kcl.ac.uk/consult/argumentation-engine/blob/upload/README.md)) ...

## Download

(Recommended) [Create an SSH key](https://help.github.com/en/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) and clone this repository.

```
git clone git@github.kcl.ac.uk:consult/dialogue-manager.git
```

(Alternative) Clone this repository using HTTPs, suppling username and password:

```
git clone https://github.kcl.ac.uk/consult/dialogue-manager.git
```

## Documentation

[View](https://github.kcl.ac.uk/pages/consult/dialogue-manager/).

### Standalone mode

While running, the dialogue manager can also operate in 'standalone' mode (i.e. without any connected components, such as a Mattermost server), and respond to requests directly, e.g.:

```
curl -H 'Content-Type: application/json' -X POST http://localhost:3007/dialogue/response -d '{"command":"/discuss-a-symptom","context":{"chatContext":{"chatId":"1234"}}}'
```

## Editing

This is an [express](https://expressjs.com/) project. The majority of the logic is contained within [app.js](app.js), and in the routes and lib folders.

Once a file is edited, stage, commit and push changes from the root folder as follows:

```
git add .
git commit -m "[details of changes]"
git push
```

## Running

Ensure you are in the root folder. Create a node virtual environment (within a python virtual environment), and activate it:

```
virtualenv env
. env/bin/activate
pip install nodeenv
nodeenv nenv
. nenv/bin/activate
```

Install dependencies:

```
cat requirements.txt | xargs npm install -g
```

Create an environment file:

```
touch .env
```

Add the following information to this environment file using a text editor:

```
MATTERMOST_ADMIN_USERNAME=[username]
MATTERMOST_ADMIN_PASSWORD=[password]
MATTERMOST_WEBHOOK="[hook]"
```

Where [hook] is the an incoming mattermost webhook for sending alerts (See: [https://docs.mattermost.com/developer/webhooks-incoming.html](https://docs.mattermost.com/developer/webhooks-incoming.html)), and the username and password associated with an administrator account.

Run server:

```
npm start
```

The server runs by default on port 3007. Visit localhost:3007/[route] to test changes to GET endpoints and use software such as [Postman](https://www.getpostman.com/) to test changes to POST (and other) endpoints.

## Deployment

Deployment is via [Docker](https://docs.docker.com/compose/install/), and includes containers for this application, a production SQL database and an optional reverse proxy. If using the reverse proxy, fill in the appropriate [configuration](proxy/nginx.conf).

Build these containers:

```
docker-compose build
```

Run these containers:

```
docker-compose up
```

(Optional) Run without proxy:

```
docker-compose up --scale proxy=0
```

Different docker-compose files exist to accomodate different service configurations.

### Custom certs

To use custom certificates for communication with this service's proxy, reference them in the proxy's [Dockerfile](proxy/Dockerfile). The [gen-domain-cert](proxy/certs/gen-domain-cert.sh) script can be used to generate custom certs (e.g. 'danvers.crt') using a CA root cert (e.g. 'consult.crt') and accompanying keys. If distributing an image outside of an organisation, edit [Dockerfile](proxy/Dockerfile) and [docker-compose](docker-compose.yml) to mount a volume on the host containing the certs instead, so that images are not transferred with the certs inside then.

## Logging

The progression of dialogues is tracked using the [provenance template server]().

## Built With

* [Express](https://expressjs.com/) - The web framework used.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/martinchapman/nokia-health/tags).

## Authors

Produced as part of the [CONSULT project](https://consult.kcl.ac.uk/).

![CONSULT project](https://consult.kcl.ac.uk/wp-content/uploads/sites/214/2017/12/overview-consult-768x230.png "CONSULT project")

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
