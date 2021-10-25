# cloud-sync-client

This is a fork of [2-IMMERSE/cloud-sync](https://github.com/2-IMMERSE/cloud-sync) to provide a self-contained and slightly modernised build of the client only. A more recently updated version of the server software is available in [bbc/cloud-sync](https://github.com/bbc/cloud-sync).

## Changes

* All server-side code has been removed.
* Third-party dependencies have been upgraded where possible.
* The `grunt` build system has been replaced with using `webpack` directly.
* A number of changes were made to the source code for use in the audio orchestration libraries.
    * Add `ApplicationBroadcast` message type and send/receive methods (`ApplicationBroadcast.js`, `CloudSynchroniser.js`).
    * Emit a `DeviceStatus` event on device status messages (`CloudSynchroniser.js`).
    * Use a provided `sysClock` instead of always creating a new `DateNowClock` (`CloudSynchroniser.js`).
    * Change `keepalive` parameter in `mqttmessagingadapter` to 60s.
    * Make `timelineUpdateChannel` field optional in `TimelineRegistrationRESP` message (`TimelineRegistrationRESP.js`).
    * Disable verbose logs (`CloudSynchroniser.js`).
    * Replace the paths in most `require` calls throughout to be relative or use defined aliases, instead of relying on adding each source folder to a search path.
    * Move the URL parsing for the wall clock connection from `CloudSynchroniser.js` to `WallClockSynchroniser.js` and use the `pathname` component if provided.
    * Explicitly import the `buffer` module instead of relying on a global definition (`util/b64.js`).

## Usage

The documentation for the API and usage instructions for the client library can be found in [client-api.md](client-api.md)

## Development

If you wish to build it into a single JS file suitable for the browser (i.e.
for including in a webpage) then do this:

```
npm run build
```

The resulting JS client library is placed in `dist/browser/CloudSyncKit.js`.

## Licence and Authors

> @bbc/audio-orchestration-cloud-sync-client
> Copyright (C) 2021 BBC R&D

See the [LICENSE](./LICENSE) file for terms applicable to this package, and the top-level [Readme](../../Readme.md) file for further information.

All code and documentation is licensed by the original author and contributors under the Apache License v2.0:

* [British Broadcasting Corporation](http://www.bbc.co.uk/rd) (original author)
* [Centrum Wiskunde & Informatica](http://www.cwi.nl/)

See AUTHORS.md file for a full list of individuals and organisations that have
contributed to this code.


