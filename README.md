# BBC Audio Toolkit
The BBC Audio Toolkit extends the [Web Audio API](http://webaudio.github.io/web-audio-api/) to provide streaming of DASH format audio and rendering of object-based audio.

The library is divided into several modules: `core` contains promise-based file loaders; `dash` contains loaders and parsers for DASH manifest files, and a node to stream DASH format audio; `renderer` contains a node to render speaker or binaural mixes of object-based audio, and helper functions to process HRTFs.

## Installation
Library modules (core, dash, ...) are made available on the `bbcat` base object. This object can be installed with npm (and required/imported) or by including the minified library in an HTML document, making the `bbcat` object available to subsequent scripts.

To install with npm:
```
npm install --save "git+ssh://git0.rd.bbc.co.uk/javascript-audio-libraries/bbcat-js.git"
```

To install with the minified library:
```html
<script src="js/bbcat.js"></script>
```


## Examples
These following examples assume the library has been installed using npm and the `bbcat` base object has been imported. The examples are ES6 compliant. Full documentation of the library with examples can be found in */doc/index.html*.

Load and decode multiple audio files asynchronously:

```javascript
const context = new AudioContext();
const audioLoader = new bbcat.core.AudioLoader(context);

audioLoader.load([
  'url/to/audio/1.m4a',
  'url/to/audio/2.m4a'
]).then((decodedAudioArray) => {
  // Use the decoded audio (decodedAudioArray[0], decodedAudioArray[1])
}).catch((error) => {
  console.log(error);
});;
```

Stream object-based DASH audio and render to a stereo speaker pair:

```javascript
const manifestLoader = new bbcat.dash.ManifestLoader();
const manifestParser = new bbcat.dash.ManifestParser();

manifestLoader.load('url/to/manifest.mpd')
  .then((manifestBlob) => {
    // Parse the manifest blob to a manifest object.
    const manifest = manifestParser.parse(manifestBlob);

    // Create audio nodes.
    const context = new AudioContext();
    const dashSourceNode = new bbcat.dash.DashSourceNode(context, manifest);
    const stereoRendererNode = new bbcat.renderer.createStereoRenderer(
      context, dashSourceNode.outputs.length);

    // Connect nodes.
    stereoRendererNode.connect(context.destination);
    for (let i = 0; i < dashSourceNode.outputs.length; i++) {
      dashSourceNode.connect(stereoRendererNode, i, i);
    }

    // Pass metadata from the DashSourceNode to the RendererNode.
    dashSourceNode.addEventListener('metadata', function (e) {
      stereoRendererNode.addMetaData(e.metadata);
    });

    // Start playback and rendering synced to the same context time.
    const contextSyncTime = context.currentTime;
    dashSourceNode.prime().then(() => {
      dashSourceNode.start(contextSyncTime);
      stereoRendererNode.start(contextSyncTime);
    });
  })
  .catch((error) => {
    console.log(error);
  });

```

## Development
This library is written in modular [ES6](http://es6-features.org/) and uses [npm](https://www.npmjs.com/) for dependency management.

Install for development:
```
git clone git://git0.rd.bbc.co.uk/javascript-audio-libraries/bbcat-js.git
cd bbcat-js
npm install
```

Build (lint, test, generate documentation, and package) the library:
```
npm run build
```

In order to aid development, the library can be hosted locally (at `localhost:8080`) and automatically re-packaged whenever a source file is changed:
```
npm start
```

### Code Style and Linting
Code is written in ES6 and is styled following the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript). Furthermore, [ESLint](http://eslint.org/) is used to lint all code, ensuring it meets these guidelines.

Linting can be run with `npm run lint`. Linting is also performed as part of the build process.

###  Library Structure and Tests
The source ES6 files are located in the */src* directory. Modules (core, dash, ...) are grouped within directories of the same name. Each module contains an *_index.js* file that exports public classes. The indexes are then exported on the global `bbcat` object in *bbcat.js*.

Tests are written using the [jasmine](https://github.com/jasmine/jasmine) testing framework. Tests are located in the */test* directory within subdirectories mirroring those of */src*. For example, the tests covering */src/core/event-target.js* are */test/core/event-target.spec.js*. Tests output HTML coverage reports to the */test/_coverage* directory on completion.

Tests can be run once with `npm run test` or run whenever a covered file changes with `npm run watch:test`. Tests are also run as part of the build process.

### Documentation
All classes, constructors, methods and properties are documented in-place with block comments in [ESDoc](https://esdoc.org/) format. HTML API documentation is generated from these comments to the */doc* directory.

Documentation can be generated or updated with `npm run doc`. Documentation is also generated as part of the build process.

### Packaging
The entry point for the build process is the */src/bbcat.js* file. The entry point and referenced files are packaged with [webpack](https://webpack.github.io/) and transpiled with [Babel](https://babeljs.io/) to ES5 compliant code. The packaged library is output at */dist/bbcat.js*.

The library can be packaged with `npm run webpack`. The library is also packaged as part of the build process.
