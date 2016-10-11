# BBC Audio Toolkit - Adaptive, Personalised Audio Compression

An example application that demonstrates how the `ApacNode` can be used to manage to the volume and range of an input programme w.r.t. background noise captured with the device microphone.

## Installation

To install:
- Clone the parent `bbcat-js` project.
- Run `npm install` in the `bbcat-js` directory.
- Run `npm install` in the `bbcat-js/examples/apac` directory.

To run:
- Run `npm start` in the `bbcat-js/examples/apac` directory.
- Point a web browser at `http://localhost:8080/`.

To build a static bundle:
- Run `npm run webpack` in the `bbcat-js/examples/apac` directory.

## Usage

Three graphs are displayed: Background/mic loudness; input programme loudness; and output programme loudness. The input programme is noise at a constant loudness. This allows the automated volume and range adjustment to be more easily observed on the output programme.
