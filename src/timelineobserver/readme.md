# TimelineObserver Microservice

This microservice monitors changes to timeline positions and speed and reports these as events to be consumed by SyncController instances.

The TimelineObserver service subscribes to these MQTT topics for timeline updates messages:
- `Sessions/+/timelines/+/state`

It publishes  a `TimelineStateChange` event if the timeline update message represents a significant change from the last known timestamp of the timeline beng observed.



# Authors
Rajiv Ramdhany (BBC)  (rajiv.ramdhany@bbc.co.uk)



## Misc.

 java -jar ./TelemetryPump-jar-with-dependencies.jar -r 192.168.1.106:8500 -d redis -s mosquitto-1883 -t Sessions/+/timelines/+/state
 $ docker run -i -t --entrypoint /bin/bash nirish777/sessioncontroller
 docker run -it --network cloud-sync_2immerse --entrypoint /bin/ash timelineobserver
 java -jar TimelineObserver-jar-with-dependencies.jar -r consul:8500 -d redis -b mqttbroker -t Sessions/+/timelines/+/state