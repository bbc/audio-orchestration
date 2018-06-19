# Synchronisation Service and Client Library

An implementation of a Synchronisation Service in nodejs and its client library JS (intended for use in the browser).


## Getting started

### 1. Clone the repository and install dependencies

First download and then install dependencies:

    $ cd cloudsync
    $ npm install

Note that NPM install might fail if NPM is not able to access your credentials for the
project repository.


### 2. EITHER: Build the client library for the browser

If you wish to build it into a single JS file suitable for the browser (i.e.
for including in a webpage) then do this:

    $ grunt

The resulting JS client library is placed in `dist/browser/Cloud-SyncKit.js`.

**Usage instructions for the client library can be found in [src/client/readme.md](src/client/readme.md)**


### OR: build the synchronisation service and run it on a server machine or cloud platform

1. Make sure docker-compose is installed:
    docker-compose installation instructions are available here: `https://docs.docker.com/compose/install/`


2. Build microservice images and instantiate containers using the docker-compose tool.

    The `docker-compose.yml` YAML file specifies the microservices in the cloud-sync service:
    1. WallClock service
    2. SessionController service
    3. SyncController service
    4. Redis
    5. Mosquitto (MQTT broker)
    6. TimelineObserver service
    7. Consul
    8. Registrator

  Run the following script:

    $ ./start_services.sh

3. Check that your containers have started successfully and are discoverable:

  Open the web UI at this URL in your browser: `http://<SERVER_IP>:8500/`
   

4. Check if the sync servic is working by loading this demo app on a browser: `http://<SERVER_IP>:3000`



## Documentation

JSDoc documentation can be built:

    $ grunt jsdoc

Documentation is generated and output as HTML into the `doc` subfolder.


## Unit tests

Unit tests are written using the jasmine unit test framework.

    $ grunt test



## Authors

 * Christoph Ziegler (IRT)
 * Rajiv Ramdhany (BBC)