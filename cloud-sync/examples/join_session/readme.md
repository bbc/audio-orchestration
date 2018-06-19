Example sending a join session request
=======================================

This repository contains an example of using the client library to register devices to a session.

Usage
-----
1. Before running the example, start the containerised MQTT broker server. See the ReadMe file in ../docker-mosquitto folder for instructions.

2. To view the output of the docker-mosquitto server:

    $ sudo docker logs -f <name-of-container>

3. Install dependencies and build the client library:

    $ npm install

3. Install dependencies and build the web app:

    $ cd examples/mqtt-joinREQ

    $ npm install
    $ grunt

  Open the following URL in your browser to instantiate a web app:

    http://localhost:8446
