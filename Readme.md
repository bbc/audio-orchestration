# bbcat-orchestration

This repository contains Javascript components for building synchronised object based audio
experiences.

## Components Overview

![Orchestration Architecture](images/orchestration-architecture.png)

* [sync-players](src/sync-players/):
  Audio players with synchronisation based on `bbcat-js` DASH and buffer sources, and a
  sync-controller to lock them to a timeline clock.
* [sync](src/sync/):
  Wrapper for communicating with different synchronisation and message exchange services. Currently
  implements an adapter for the `cloud-sync` service.
* [mdo-allocator/receiver](src/mdo-allocation/):
  A rule set for allocating individual objects to synchronised devices, based on knowledge about
  available objects and devices. The allocator runs on the main device, the receiver on auxiliary
  devices.
* [sequence-renderer](src/sequence-renderer/):
  A renderer for managing playback of multiple audio sources scheduled on a synchronised timeline.
* [orchestration-client](src/orchestration/):
  A single class managing all the above components to expose a single interface. Mainly manages the
  multi-step setup process, provides user input methods, and exposes state-change events.

## Setup

[Node.js](https://nodejs.org/en/) 8 and [yarn](https://yarnpkg.com/en/) are recommended.

Install all dependencies for the main library:

```
yarn install
```

### cloud-sync

The `cloud-sync` client library is used to connect to a hosted synchronisation
service. For development, it is recommended to use the `dvbcss-sync-adapter`
instead, an example standalone server implementation is
[provided](examples/dvbcss-services/).

A version of the client library with our local patches is included in this
repository in the [cloud-sync/](cloud-sync/) directory. See [subtree.md](subtree.md)
to setup git remotes for developing it.

## Development

The examples may be used to manually test the library components as they are developed.

### Examples

 * [players](examples/players/) plain audio playback
 * [cloud-sync-client](examples/cloud-sync-client/) synchronisation to cloud sync service
 * [not maintained] [dvbcss-services](examples/dvbcss-services/) synchronisation to dvbcss services
 * [sequence-renderer](examples/sequence-renderer/) rendering a synchronised timeline
 * [sequence-renderer-loop](examples/sequence-renderer-loop/) rendering a looping timeline
 * [mdo-allocation](examples/mdo-allocation/) demonstrating allocation rules

A complete integration can also be found in the
[bbcat-orchestration-template](https://github.com/bbc/bbcat-orchestration-template)
repository, which implements a React user interface template recommended for starting new projects.

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
