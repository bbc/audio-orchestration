Example mqtt client using websockets
=====================================

This repository contains a simple example use of the Paho MQTT client library.

Usage
-----
1. Before running the example, start the containerised MQTT broker server. See the ReadMe file in ../docker-mosquitto folder for instructions.

2. To view the output of the docker-mosquitto server:

    $ sudo docker logs -f <name-of-container>

3. Install dependencies,  build the web app and run:

    $ cd examples/mqtt-browser-client
    $ npm install
    $ grunt

  Open the following URL in 2 browser instances to instantiate 2 web clients:

    http://localhost:8445/testmqtt.html
