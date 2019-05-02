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

The recommended way to use the library is to include it as part of a webpack build. You can take advantage of tree-shaking (de-duplicating common dependencies) by importing individual ES6 modules directly from `src/`:  For example, use `import OrchestrationClient from 'bbcat-orchestration/src/orchestration'`. For convenience, the top-level classes are also available as `import { OrchestrationClient } from 'bbcat-orchestration'`.

Alternatively, a webpack bundle including all dependencies can be created by running `yarn build`. This creates a single large file using a Universal Module Definition (UMD) in `dist/` that works when included as a `<script>` tag, exposing the global `bbcatOrchestration` object. Its properties are defined in `src/index.js`.

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
yarn install
```

NB: some depen

### available scripts

`yarn dev` creates a development build, `yarn build` creates a production build of the complete library in `dist/`.

`yarn lint` runs `eslint` to check for coding style violations.

`yarn doc` generates the documentation in the `docs/` folder.

### bbcat-js

The `bbcat-js` library is used for its WebAudio DASH streaming implementation. A patched version is
included in the [bbcat-js/](bbcat-js/) directory.

See [subtree.md](subtree.md) to setup git remotes for developing them. Changes have to be pushed to the specified remote branches in the original repository, as `package.json` does not allow specifying subdirectories of a repository for dependencies. Changes are only picked up when installing this library if they are in the repository and branch specified in `package.json`.

### Linking libraries

To develop the `bbcat-js` library alongside `bbcat-orchestration`, they may be linked to use the local development version instead of the version installed in `node_modules`.

First, run `yarn install` in `bbcat-js/` to install its development dependencies.

Then, run `yarn link` in `bbcat-js/`. This registers the development version with `yarn`.

Now, back in the repository root, the linked version can be enabled using `yarn link bbcat-js`.

The same process may be used to link the `bbcat-orchestration` package into each of the examples after running `yarn install` in their directories.
