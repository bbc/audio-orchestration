# Audio Orchestration

This repository will hold the open source audio orchestration library and template application used by _Audio Orchestrator_.

## Components

* [`@bbc/audio-orchestration-template`](packages/template): graphical user interface - start here to develop custom functionality.
* [`@bbc/audio-orchestration-core`](packages/core): core library managing connected devices, the allocation algorithm, and synchronised playback.
* [`@bbc/audio-orchestration-bbcat-js`](packages/bbcat-js): helper library for WebAudio playback.
* [`@bbc/audio-orchestration-cloud-sync-client`](packages/cloud-sync-client): client library connecting to the synchronisation service.

## See also

* [Audio Orchestrator](https://www.bbc.co.uk/makerbox/tools/audio-orchestrator), our production tool built on top of this template and library, is available free of charge from [BBC MakerBox](https://www.bbc.co.uk/makerbox/). 
* The [Audio Orchestrator documentation](https://bbc.github.io/bbcat-orchestration-docs/) includes a [list of experiences made with these tools](https://bbc.github.io/bbcat-orchestration-docs/productions/).
* You may wish to run your own synchronisation server, based on the [cloud-sync](https://github.com/bbc/cloud-sync) framework.

# Usage

The most common way to use this code is to fork this repository and follow the _Development_ instructions below to create a custom template distribution. This can then be used with _Audio Orchestrator_ to add encoded media and metadata files.

# Development

You need Node.js (14, but earlier versions will likely still work) and npm (need version 7 or higher for the workspace support).

First install the dependencies, then build all of them once (the `-ws` flag tells npm to run the command for each package).

```sh
npm install
npm run build -ws
```

Then you can, for example, start a development server for the template, which will use the other packages you've just built:

```sh
cd packages/template
npm run dev
```

# License

The majority of our components (`template`, `core`, and `bbcat-js`) are licensed under the GPLv3 license. The `cloud-sync-client` is licensed under an Apache 2.0 license. See the LICENSE file in each package directory for the specific licensing terms and copyright information.

If you are modifying the software to create your experience you may have to make your source code modifications available under the terms of the GPL license.
