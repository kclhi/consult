# Sensor-FHIR-Mapper (sensor-to-fhir)

Convert sensor data in a vendor format to FHIR. Part of the wearable server.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Before starting, [download and install python](https://www.python.org/downloads/), [pip](https://packaging.python.org/tutorials/installing-packages/#use-pip-for-installing), [virtualenv](https://virtualenv.pypa.io/en/latest/installation/) and [Node.js](https://nodejs.org/en/download/).

### Other service communication

Receives messages from: device-integration_nokia ([install](https://github.kcl.ac.uk/consult/device-integration_nokia/blob/master/README.md)) and device-integration_garmin ([install](https://github.kcl.ac.uk/consult/device-integration_garmin/blob/master/README.md)).

Sends messages to: fhir-server ([install](https://github.kcl.ac.uk/consult/fhir-server/blob/master/README.md)).

## Download

(Recommended) [Create an SSH key](https://help.github.com/en/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) and clone this repository.

```
git clone git@github.kcl.ac.uk:consult/sensor-fhir-mapper.git
```

(Alternative) Clone this repository using HTTPs, suppling username and password:

```
git clone https://github.kcl.ac.uk/consult/sensor-fhir-mapper.git
```

## Documentation

[View](https://github.kcl.ac.uk/pages/consult/sensor-fhir-mapper/).

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
USERNAME=[FHIRServerUsername]
PASSWORD=[FHIRServerPassword]
```

Where [FHIRServerUsername] and [FHIRServerPassword] are replaced with their real values.

### Running (HTTP endpoints)

Run server:

```
npm start
```

The server runs by default on port 3001. Visit localhost:3001/[route] to test changes to GET endpoints and use software such as [Postman](https://www.getpostman.com/) to test changes to POST (and other) endpoints.

### Running (Message queue consumer)

Run message consumer:

```
npm consume
```

## Running the tests

-

## Deployment

Deployment is via [Docker](https://docs.docker.com/compose/install/), and includes containers for this application, and an optional message queue.

Build these containers:

```
docker-compose build
```

Run these containers:

```
docker-compose up
```

(Optional) Run without queue:

```
docker-compose up --scale webapp-queue=0 rabbit=0
```

## Built With

* [Express](https://expressjs.com/) - Web framework.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/martinchapman/nokia-health/tags).

## Authors

Produced as part of the [CONSULT project](https://consult.kcl.ac.uk/).

![CONSULT project](https://consult.kcl.ac.uk/wp-content/uploads/sites/214/2017/12/overview-consult-768x230.png "CONSULT project")

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

*
