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

[Node.js](https://nodejs.org/en/) 8+ a is recommended.

Install all dependencies for development of the main library:

```
npm install
```

NB: `yarn install` currently fails on some cloud-sync dependencies, so using plain old `npm` is recommended for now.

### cloud-sync

The `cloud-sync` client library is used to connect to a hosted synchronisation
service. For development, it is recommended to use the `dvbcss-sync-adapter`
instead, an example standalone server implementation is
[provided](examples/dvbcss-services/).

A version of the client library with our local patches is included in this
repository in the [cloud-sync/](cloud-sync/) directory. See [subtree.md](subtree.md)
to setup git remotes for developing it.

## Examples

 * [players](examples/players/) DASH and buffer source audio players
 * [cloud-sync-client](examples/cloud-sync-client/) synchronisation to 2-IMMERSE cloud-sync service
 * [sequence-renderer](examples/sequence-renderer/) rendering a synchronised timeline using cloud-sync
 * [sequence-renderer-loop](examples/sequence-renderer-loop/) rendering a looping timeline
 * [mdo-allocation](examples/mdo-allocation/) demonstrating allocation rules
 * [not maintained] [dvbcss-services](examples/dvbcss-services/) synchronisation to dvbcss services, incomplete implementation

A complete integration can also be found in the
[bbcat-orchestration-template](https://github.com/bbc/bbcat-orchestration-template)
repository, which implements a React.js user interface template recommended for starting new projects.
