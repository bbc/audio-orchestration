# bbcat-orchestration

This repository contains browser components for building synchronised object
based audio experiences.

__This is currently a work in progress, and most of the packages below do not exist yet.__

## Components Overview

* [sync-players](src/sync-players/Readme.md):
  Controlled audio players with synchronisation based on `bbcat-js` DASH and buffer sources.
* [cloud-sync-adapter](src/cloud-sync-adapter/Readme.md):
  A wrapper for synchronising with the `cloud-sync` service.
* [dvbcss-sync-adapter](src/dvbcss-sync-adapter/Readme.md):
  A wrapper for synchronising with self-hosted `dvbcss` synchronisation
  services, includes an example server for local development.
* [mdo-allocation](src/mdo-allocation/Readme.md):
  A rule set for allocating individual objects to synchronised devices, based on
  knowledge about available objects and devices.
* [renderer](src/renderer/Readme.md):
  A renderer for managing playback of multiple audio sources scheduled on a
  synchronised timeline.

## Setup

[Node.js]() 8 and [yarn]() are recommended for the development environment.

```
yarn install
```

## cloud-sync

The `cloud-sync` client library is used to connect to a hosted synchronisation
service. For development, it is recommended to use the `dvbcss-sync-adapter`
instead, an example standalone server implementation is
[provided](examples/dvbcss-services/).

A pre-release version of the library can be accessed from the Audio Team project
drive. Run `./get-cloud-sync.sh` to install it. This may fail to download a
`.jar` file if run behind a proxy, in this case, run `(cd cloud-sync && npm
install && npm run prepare)` again on an open network with the proxy disabled.

## Development

The examples and the test suite, may be used to develop the library.

### Examples

To develop the library together with an example, first install the example's
dependencies and link this development version into its `node_modules`.

```
# start in this folder, bbcat-orchestration/:
yarn install
yarn link

cd example/dvbcss-services
yarn install
yarn link bbcat-orchestration
```

Then follow the example's instructions, usually simply run `yarn dev` to start a
web server with hot-reloading on changes to the example or library code.

### Tests

Run `yarn tests` to run the tests.
