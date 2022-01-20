# bbcat-js

This package provides components for parsing MPEG-DASH manifests and playing DASH audio streams using the WebAudio API.

_NB: This is a legacy approach originally written for early WebAudio experiments at the BBC, and still in our core audio orchestration library. It is **not** the current recommended approach for playing back DASH media, and likely not useful outside the context of this repository._

The original bbcat-js library was written by Matt Paradis, Craig Wright, and Chris Pike of BBC Research and Development.

## Usage example

```js
import bbcat from '@bbc/audio-orchestration-bbcat-js';
const { ManifestLoader, ManifestParser, DashSourceNode } = bbcat.dash;

this.manifestLoader = new ManifestLoader();
this.manifestParser = new ManifestParser();

const context = new AudioContext({ sampleRate: 48000 });

const play = async (manifestUrl) => {
  const manifestBlob = await manifestLoader.load(manifestUrl);

  const manifest = await manifestParser.parse(manifestBlob);
  
  const source = new DashSourceNode(context, manifest);

  await source.prime(0);

  source.connect(context.destination);

  source.start(context.currentTime);
};
```

## Development

Build the library in development mode, watching for changes:

```
npm run dev
```

Build the minified production library:

```
npm run build
```

This produces a `dist/bbcat.js` bundle that exports the `core` and `dash` components.

Run the test suite in Chrome and Firefox:

```
npm run test:browser
```

The code is commented, and HTML documentation can be built using `npm run doc` and then found in `doc/index.html`.

## Licence and contributions

> @bbc/audio-orchestration-bbcat-js
> Copyright (C) 2022 BBC R&D

See the [LICENSE](./LICENSE) file for terms applicable to this package, and the top-level [Readme](../../Readme.md) file for further information.
