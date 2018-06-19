
# Mock-Session-Controller: a Mock controller for Sync Session

A mock session controller that subscribes for JoinREQ messages for
a particular session, processes the messages and replies by sending
JoinRESP messages.


## Getting started
### 1. Build client libraries

First build the cloud-sync client library:
    $ cd cloud-sync
    $ npm install

### 2. Build and install dependencies

  Install dependencies and build the session controller:

      $ cd mock-sessioncontroller
      $ npm install


### 3. Start the Mosquitto Docker container

 Open a new terminal window and start the containerised MQTT broker server. See the ReadMe file in ../docker-mosquitto folder for instructions.

To view the output of the docker-mosquitto server:

    $ sudo docker logs -f <name-of-container>


### 4. Start the session controller

In a nw terminal window, go to the ` mock-sessioncontroller` folder and type:

    $ node src/main.js --sessionid=123

This will start the session controller for a session with id=123.

## Start a client web app to join the session

In a new terminal window , go to the project's root folder and type:

$ cd examples/mqtt-joinREQ

$ npm install
$ grunt

Open the following URL in your browser to instantiate a web app:

http://localhost:8446

Follow the instructions on the webpage.

## Authors

 * Rajiv Ramdhany (BBC)
 * Christoph Ziegler (IRT)
