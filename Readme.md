# bbcat-orchestration

This repository contains browser components for building synchronised object
based audio experiences.

__This is currently a work in progress, and most of the packages below do not exist yet.__

## Components Overview

* [sync-players](src/sync-players/):
  Controlled audio players with synchronisation based on `bbcat-js` DASH and buffer sources.
* [sync](src/sync/):
  Wrapper for communicating with synchronisation and message exchange services. Contains adapters
  for synchronising with the `cloud-sync` service.
* [mdo-allocation](src/mdo-allocation/):
  A rule set for allocating individual objects to synchronised devices, based on
  knowledge about available objects and devices.
* [renderer](src/renderer/):
  A renderer for managing playback of multiple audio sources scheduled on a
  synchronised timeline.

## Setup

[Node.js](https://nodejs.org/en/) 8 and [yarn](https://yarnpkg.com/en/) are recommended.

Install all dependencies for the main library:

```
yarn install
```

## cloud-sync

The `cloud-sync` client library is used to connect to a hosted synchronisation
service. For development, it is recommended to use the `dvbcss-sync-adapter`
instead, an example standalone server implementation is
[provided](examples/dvbcss-services/).

A version of the client library with our local patches is included in this
repository in the [cloud-sync/](cloud-sync/) directory.

## Development

The examples and the test suite, may be used to develop the library.

### Examples

To develop the library together with an example, first install the example's
dependencies and link this development version into its `node_modules`. The
examples will try to install their own version of `bbcat-orchestration` from
GitHub, linking the local version can make changes to the library immediately
visible in the example.

```
# start in this folder, bbcat-orchestration/:
yarn install
yarn link

# do the same for cloud sync:
cd cloud-sync
npm install
yarn link
cd ..

# use local copy of synckit cloud
yarn link synckit-cloud

# now install the dependencies for an example:
cd example/dvbcss-services
yarn install
yarn link bbcat-orchestration
cd ../../

# or a cloud sync example requiring synckit-cloud
cd example/cloud-sync-client
yarn install
yarn link bbcat-orchestration
yarn link synckit-cloud
cd ../../


```

Then follow the example's instructions, usually simply run `yarn dev` to start a
web server with hot-reloading on changes to the example or library code.

### Tests

Run `yarn tests` to run the tests.
