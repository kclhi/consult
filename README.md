# Data Miner (data-miner)

Analyse patient sensor data.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Before starting, [download and install R](https://www.python.org/downloads/).

Run R:

```
R
```

Install packages listed in [requrements.txt](requirements.txt), e.g.

```
> install.packages('pumber')
```

## Download

(Recommended) [Create an SSH key](https://help.github.com/en/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) and clone this repository.

```
git clone git@github.kcl.ac.uk:consult/data-miner.git
```

(Alternative) Clone this repository using HTTPs, suppling username and password:

```
git clone https://github.kcl.ac.uk/consult/data-miner.git
```

## Documentation

[View](https://github.kcl.ac.uk/pages/consult/data-miner/).

## Editing

[r-code-for-bp-alert.R](r-code-for-bp-alert.R) contains the main logic.

Once a file is edited, stage, commit and push changes from the root folder as follows:

```
git add .
git commit -m "[details of changes]"
git push
```

## Running

Run server:

```
Rscript r-server.R
```

The server runs by default on port 3006. Visit localhost:3006/[route] to test changes to GET endpoints and use software such as [Postman](https://www.getpostman.com/) to test changes to POST (and other) endpoints.

## Running the tests

-

## Deployment

Running the software on a server is the same as running it locally: clone and run the project on a remote machine. One can make local changes, push them and then pull them on the remote server.

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

## Acknowledgments

*
