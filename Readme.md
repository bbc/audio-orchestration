# Audio Orchestration

<img alt="BBC R&D: Audio Orchestration" src="doc/data-card.png" width="400" height="100" />

**Create immersive and interactive audio experiences for multiple synchronised devices.**

This repository holds the open source audio orchestration template application and libraries used by _Audio Orchestrator_.

The [Audio Orchestrator documentation](https://bbc.github.io/bbcat-orchestration-docs/) includes a [list of experiences made with these tools](https://bbc.github.io/bbcat-orchestration-docs/productions/).

## Components

<img alt="Components and dependencies" src="doc/repo-structure.png" width="368" height="158" />

We provide a **template** application which can easily be extended to customise the user interface. It uses our **core** library for managing the connected devices, synchronisation, and audio rendering. This in turn uses our internal helper libraries: **bbcat-js** (audio streaming), and **cloud-sync-client** (connection to the synchronisation server).

The [**cloud-sync** server](https://github.com/bbc/cloud-sync) source code is published separately on GitHub. The template and examples in this repository refer to a an instance of this software hosted on a BBC server that may be suitable for experimentation, however no guarantees are given as to its availability.

Our [Audio Orchestrator](https://www.bbc.co.uk/makerbox/tools/audio-orchestrator) production tool for authoring metadata and packaging media for use with the template and core library is available through BBC MakerBox.

More detailed information about each of the packages is available in the respective Readme files.

* [`@bbc/audio-orchestration-template`](packages/template)
* [`@bbc/audio-orchestration-core`](packages/core)
* [`@bbc/audio-orchestration-bbcat-js`](packages/bbcat-js)
* [`@bbc/audio-orchestration-cloud-sync-client`](packages/cloud-sync-client)

# Usage

The most common way to use this code is to **fork this repository** and follow the _Development_ instructions below to create a custom template distribution. This can then be used with _Audio Orchestrator_ to add encoded media and metadata files.

Advanced usage:

If needed, you can also install our pre-built packages by specifying the GitHub Package Registry for the `@bbc` scope in an `.npmrc` file for your project.

```sh
echo "@bbc:registry=https://npm.pkg.github.com" >> .npmrc
npm add @bbc/audio-orchestration-core
```

**NB until this repository is made public, you will need to [login to npm](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token) with a GitHub token with access to the BBC organisation to make this work.**

# Development

You need Node.js (14, but earlier versions will likely still work) and npm (need version 7 or higher for the workspace support).

First install the dependencies, then build all of them once (the `-ws` flag tells npm to run the `build` command for each package).

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

You may [contact BBC R&D](https://www.bbc.co.uk/rd/contacts) to discuss alternative licensing options; however the BBC is under no obligation to offer alternative terms.

# Contributing

Please contact the authors by [raising a GitHub issue](https://github.com/bbc/audio-orchestration/issues/new) or pull request if you would like to contribute to this repository. A contributor licence agreement may be applicable.
