
# WallClock Service

<img src="https://2immerse.eu/wp-content/uploads/2016/04/2-IMM_150x50.png" align="left"/><em>This project was originally developed as part of the <a href="https://2immerse.eu/">2-IMMERSE</a> project, co-funded by the European Commission’s <a hef="http://ec.europa.eu/programmes/horizon2020/">Horizon 2020</a> Research Programme</em>

## Overview
A time synchronisation service based on the WallClock synchronisation protocol from DVB-CSS. This service supports both UDP and WebSocket clients. For WebSocket clients, both JSON and binary message formats are supported.


## Getting started
### 1. Download and install dependencies

First download and then install dependencies:

    $ cd wallclock-service
    $ npm install

Note that NPM install might fail if NPM is not able to access your credentials for the
project repository.

(NPM 'link' is no longer required for project private packages. This is
because the dependency entry in package.json now points directly to the
repository URL)


### 2. Run the service

Go to the service folder and type"

    $ npm start


## Unit tests

Unit tests are written using the jasmine unit test framework.

    $ grunt test


## Dependencies



## Protocol implementation details

### Wall Clock sync protocol

The protocol is intended to be a request-response protocol that functions
identically to that defined in clause 8 of the DVB CSS specification as the
"Wall Clock protocol".

As a quick reminder: the protocol is a request-response exchange that is
initiated by the party wishing to sync its clock (client)  to the other party
(server).

Message types are as follows:

| Value | Meaning                            |
| :---: | :--------------------------------- |
| 0     | Request                            |
| 1     | Response with no follow-up planned |
| 2     | Response with follow-up planned    |
| 3     | Follow-up                          |


#### Binary format

This is implemented in `sync-protocols.WallClock.BinarySerialiser`.

Identical to the DVB CSS format.

#### JSON serialisation format

This is implemented in `sync-protocols.WallClock.JsonSerialiser`.

The protocol message format carries the same fields as the DVB CSS wall clock
protocol, however instead of encoding them in a binary structure, they are
instead carried in a JSON object. The properties of the object are as follows:

Example: (with explanatory comments that must be removed for it to be valid JSON)

    {
        "v":    0,              /* version = 0 */
        "t":    2,              /* type = response with follow-up planned */
        "p":    0.0001,         /* server clock has 0.1 millisecond precision */
        "mfe":  50,             /* server clock max freq error = 50 ppm */
        "otvs": 19346582,       /* client request sent at 19346582.9826511 seconds */
        "otvn": 982651100,      
        "rt":   29784724.1927,  /* server received request at 29784724.1927 seconds */
        "tt":   29784724.1938   /* server sent response at 29784724.1938 seconds */
    }

##### Property names and meanings

| Property name | Value type | Value meaning                  | Units/default value |
| :------------ | :--------: | :----------------------------- | :-----------------: |
| v             | Number     | Message version                | 0                   |
| t             | Number     | Message type (see below)       | (see below)         |
| p             | Number     | Server clock precision         | seconds+fractions   |
| mfe           | Number     | Server clock max freq error    | ppm                 |
| otvs          | Number     | Request sent timevalue (secs)  | whole seconds       |
| otvn          | Number     | Request sent timevalue (nanos) | nanoseconds part    |
| rt            | Number     | Request received timevalue     | seconds+fractions   |
| tt            | Number     | Response sent timevalue        | seconds+fractions   |


## Authors

 * Rajiv Ramdhany (BBC)
