# audio-orchestration-core

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

The available exports are listed in [index.js](src/index.js). If the library is installed using `npm`, it can be imported like this:

```js
import { OrchestrationClient } from '@bbc/audio-orchestration-core';
```

It is also possible to import the bundled library (`dist/bbcat-orchestration.js`) using a `<script>` tag. In this case, the exports are available on the global `bbcatOrchestration` object.

```html
<script src="bbcat-orchestration.js"></script>
<script>
  const { OrchestrationClient } = bbcatOrchestration;
</script>
```

## Examples

A number of stand-alone examples are provided to illustrate the usage of certain individual components:

 * [players](examples/players/) DASH and buffer source audio players
 * [cloud-sync-client](examples/cloud-sync-client/) connection to the cloud-sync service
 * [sequence-renderer](examples/sequence-renderer/) rendering a synchronised sequence using cloud-sync
 * [sequence-renderer-loop](examples/sequence-renderer-loop/) rendering a looping sequence
 * [mdo-allocation](examples/mdo-allocation/) demonstrating allocation rules

## Development

`npm run dev` creates a development build, `npm run build` creates a production build of the complete library in `dist/`.

`npm run lint` checks for coding style violations.

`npm run test` runs tests for the allocation algorithm implementation.

`npm run doc` generates class documentation in `docs/index.html`.

### Linking local versions of dependencies

To develop the [bbcat-js](https://github.com/bbc/bbcat-orchestration-bbcat) and [cloud-sync-client](https://github.com/bbc/bbcat-orchestration-cloud-sync-client) libraries alongside `bbcat-orchestration`, they may be linked to use the local development version instead of the version installed in `node_modules`.

E.g. run `yarn install` in `bbcat-orchestration-bbcat-js/` to install its development dependencies, then run `yarn link` to register its the development version with `yarn`.

Now, back in the `bbcat-orchestration/` repository root, the linked version can be enabled using `yarn link bbcat-js`.
