# Argumentation Engine

Primary reasoning component.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Before installing, [download and install Python 2.7](https://www.python.org/download/releases/2.7/) and [Pip](https://pip.pypa.io/en/stable/installing/), a Python package manager.

(Recommended) Then install [virtualenv](https://virtualenv.pypa.io/en/stable/installation/).

### Building (Optional)

Clone this repository:

```
git clone https://github.kcl.ac.uk/consult/argumentation-engine
```

Change into the directory:

```
cd argumentation-engine
```

(Optional) Initialise a virtual environment, and activate:

```
virtualenv .venv
. .venv/bin/activate
```

Install dependencies:

```
pip install -r requirements.txt
```

## Usage

```
export FLASK_APP=argengine_api.py; flask run
```

## Running the tests

```
pytest -vv
```

## Deployment

Deployment is via [Docker](https://docs.docker.com/compose/install/), and includes containers for this application and an optional reverse proxy.

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

## Built With

* [Flask](http://flask.pocoo.org/)

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

* -
