# Garmin (device-integration_garmin)

[![Build Status]()]()

Middleware designed to interface with the Garmin API.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Before starting, [download and install python](https://www.python.org/downloads/), [pip](https://packaging.python.org/tutorials/installing-packages/#use-pip-for-installing), [virtualenv](https://virtualenv.pypa.io/en/latest/installation/) and [Node.js](https://nodejs.org/en/download/).

### Other service communication

Sends messages to: sensor-fhir-mapper ([install](https://github.kcl.ac.uk/consult/sensor-fhir-mapper/blob/master/README.md)).

## Download

(Recommended) [Create an SSH key](https://help.github.com/en/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) and clone this repository.

```
git clone git@github.kcl.ac.uk:consult/device-integration.git
```

(Alternative) Clone this repository using HTTPs, suppling username and password:

```
git clone https://github.kcl.ac.uk/consult/device-integration.git
```

Configure submodules:

```
git submodule init
git submodule update
```

NB: If cloning over HTTPS, edit [.gitmodules](.gitmodules) to reflect the HTTPS URL before running update, and then sync with `git submodule sync` before updating.

## Documentation

[View](https://github.kcl.ac.uk/pages/consult/device-integration_garmin/).

## Editing

This is an [express](https://expressjs.com/) (lightweight server) project. The majority of the logic is contained within [app.js](app.js), and in the routes and lib folders.

Once a file is edited, stage, commit and push changes from the root folder as follows:

```
git add .
git commit -m "[details of changes]"
git push
```

## Configuration

Modify `config/default.js` to include the address of the [sensor-fhir-mapper service](https://github.kcl.ac.uk/consult/sensor-fhir-mapper):

```
SENSOR_TO_FHIR_URL: '[sensor-fhir-mapper service]'
```

If using a queue, also specify this in the config file, and supply the queue name.

Create an environment file:

```
touch .env
```

Add the following information to this environment file using a text editor:

```
USERNAME="[username]"
PASSWORD="[password]"
GARMIN_CONSUMER_KEY="[key]"
GARMIN_SECRET="[secret]"
```

Where [username] and [password] are credentials to secure this service, and [key] and [secret] are your Garmin details.

[Setup db encryption keys](https://mariadb.com/kb/en/file-key-management-encryption-plugin/) in `db`.

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

Run server:

```
npm start
```

The server runs by default on port 3000. Visit localhost:3000/[route] to test changes to GET endpoints and use software such as [Postman](https://www.getpostman.com/) to test changes to POST (and other) endpoints.

## Running the tests

Run both unit and lint tests using `npm`:

```
npm test
```

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

### Private certificates

To use custom private certificates for communication with this service's proxy, reference them in the proxy's [Dockerfile](proxy/Dockerfile). The [gen-domain-cert](proxy/certs/gen-domain-cert.sh) script can be used to generate custom certs (e.g. 'stacy.crt') using a CA root cert (e.g. 'consult.crt') and accompanying keys. If distributing an image outside of an organisation, edit [Dockerfile](proxy/Dockerfile) and [docker-compose](docker-compose.yml) to mount a volume on the host containing the certs instead, so that images are not transferred with the certs inside then.

### Public certificates

For public certificates, certificate generation is via [LetsEncrypt](https://letsencrypt.org/). Generate as follows:

1. Remove references to certificates from Nginx HTTPS configuration, as running HTTP server is required for challenge.
2. Change Cerbot command in docker-compose from `--force-renewal` to `--dry-run`.
3. Build and run, and upon successful call of HTTP challenge, change back to `--force-renewal` and build and run again in order to generate certificates.
4. Re-add certificae configuration, build and run.

Renewal can be done on re-build, or by setting up a [cron](https://www.digitalocean.com/community/tutorials/how-to-secure-a-containerized-node-js-application-with-nginx-let-s-encrypt-and-docker-compose#step-6-%E2%80%94-renewing-certificates).

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

* Garmin's original API: https://developerportal.garmin.com and https://healthapi.garmin.com/.
