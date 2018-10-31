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

## Usage

The recommended way to use the library is to include it as part of a webpack build. It is written in ES6 JavaScript, and requires babel to build. Individual classes can be imported by referencing the ES6 modules from `src/` as e.g. `import OrchestrationClient from 'bbcat-orchestration/src/orchestration/orchestration-client'` or `import { OrchestrationClient } from 'bbcat-orchestration'`.

Alternatively, a webpack bundle including all dependencies can be created by running `npm run build`, this creates a single file as a Common-JS module in `dist/` that works even when included as a `<script>` tag, exposing the global `bbcatOrchestration` object.

## Examples

A number of stand-alone examples are provided to illustrate the usage of certain individual components:

 * [players](examples/players/) DASH and buffer source audio players
 * [cloud-sync-client](examples/cloud-sync-client/) synchronisation to 2-IMMERSE cloud-sync service
 * [sequence-renderer](examples/sequence-renderer/) rendering a synchronised timeline using cloud-sync
 * [sequence-renderer-loop](examples/sequence-renderer-loop/) rendering a looping timeline
 * [mdo-allocation](examples/mdo-allocation/) demonstrating allocation rules
 * [not maintained] [dvbcss-services](examples/dvbcss-services/) synchronisation to dvbcss services, incomplete implementation

A complete integration can also be found in the
[bbcat-orchestration-template](https://github.com/bbc/bbcat-orchestration-template)
repository, which implements a React.js user interface template recommended for starting new projects.

## Setup

[Node.js](https://nodejs.org/en/) 8+ a is recommended.

Install all dependencies for development of the main library:

```
npm install
```

NB: `yarn install` currently fails on some cloud-sync dependencies, so using plain old `npm` is recommended for now.

### available scripts

`npm run dev` creates a development build, `npm run build` creates a production build of the complete library in `dist/`.

`npm run lint` runs `eslint` to check for coding style violations.

`npm run doc` generates the documentation in the `docs/` folder.

### cloud-sync and bbcat-js

The `cloud-sync` client library is used to connect to a hosted synchronisation
service. A version of the client library with our local patches is included in this
repository in the [cloud-sync/](cloud-sync/) directory.

The `bbcat-js` library is used for its WebAudio DASH streaming implementation. A patched version is
included in the [bbcat-js/](bbcat-js/) directory.

See [subtree.md](subtree.md) to setup git remotes for developing them. Changes have to be pushed to the specified remote branches in the original repository, as `package.json` does not allow specifying subdirectories of a repository for dependencies. Changes are only picked up when installing this library if they are in the repository and branch specified in `package.json`.

### Linking libraries

To develop the `bbcat-js` and `cloud-sync` libraries alongside `bbcat-orchestration`, they may be linked to use the local development version instead of the version installed in `node_modules`.

First, run `npm install` in `bbcat-js/` and `cloud-sync/` respectively to get their development dependencies. Note that changes to cloud-sync may only be picked up after running `npm run build_lib` in its directory.

Then, run `npm link` in `bbcat-js/` and `cloud-sync/`. This registers the development version with `npm`.

Now, back in the repository root, the linked version can be enabled using `npm link bbcat-js` and `npm link synckit-cloud`.


The same process may be used to link the `bbcat-orchestration` package into each of the examples after running `npm install` in their directories.
