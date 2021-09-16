# Audio Orchestration

This repository will hold the open source audio orchestration library and template application used by Audio Orchestrator.

# Development

You need Node.js and npm 7 or higher.

First install the dependencies for all our packages, then build all of them once (the `-ws` flag tells npm to run the command for each package).

```
npm install -ws
npm run build -ws
```

Then you can, for example, start a development server for the template, which will use the other packages you've just built:

```
cd packages/template
npm run dev
```

# License information

The majority of our components (`template`, `core`, and `bbcat-js`) are licensed under the GPLv3 license. The `cloud-sync-client` is licensed under an Apache 2.0 license. See the LICENSE file in each package directory for the specific licensing terms and copyright information.

If you are modifying the software to create your experience you may have to make your source code modifications available under the terms of the GPL license.
