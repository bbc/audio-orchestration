# Cloud-Sync Media Synchronisation Service 

**An implementation of a Media Synchronisation Service in Node and its client library JS (intended for use in the browser).**

Cloud-Sync is a frame-accurate inter-destination media synchronisation service that supports a number of timing control schemes and asynchrony reduction algorithms:
1. Synchronisation Master (or Maestro)
2. Distributed (no master)
3. Latest Master (Last node to change timeline is Master)

It is compatible with DVB-CSS in that it uses the notion of timelines to model the progress of media presentation and uses a time synchronisation scheme (CSS-WC) and timeline correlations to export timeline progress estimates.

It allows a client to register a timing source and for other clients  to discover that timing source, and use it as a **synchronisation timeline** for time-aligning the presentation of their own media objects.

Cloud-Sync provides a registered timing source to a client (upon request) via a Timeline Shadow. This is a local estimate of the timeline on the client device and is manifested by the cloud-sync client API as a
as a software clock  object. 

Cloud-Sync supports the following features:
* LAN-local interdevice and inter-destination media synchronisation with frame synchronisation accuracy  
* *Synchronisation Maestro*, *Distributed*, *Latest Master* timing control schemes
* * A lightweight time synchronisation scheme that can run in browser environments
* Dynamic master node election
* Dynamic sync error monitoring and alerts
* Arbitratry timing sources (media players,  artificial clocks, broadcast timelines)
* Sync protocols over multiple transports: WebSockets, UDP, TCP, MQTT
* Client Sync-Controllers for local media playback adaptation


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

**Usage instructions for the client library can be found in [client-api.md](client-api.md)**


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

 * Rajiv Ramdhany (BBC)
 * Christoph Ziegler (IRT)
