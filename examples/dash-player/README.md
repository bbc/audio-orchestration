# BBC Audio Toolkit - DASH Audio Player

An example application that demonstrates how the `DashSourceNode` can be used to construct a client capable of playing high-channel-count, object-based DASH streams.

## Installation

To install:
- Clone the parent `bbcat-js` project.
- Run `npm install` in the `bbcat-js` directory.
- Run `npm install` in the `bbcat-js/examples/dash-player` directory.

To run:
- Run `npm start` in the `bbcat-js/examples/dash-player` directory.
- Point a web browser at `http://localhost:8080/`.

To build a static bundle:
- Run `npm run webpack` in the `bbcat-js/examples/dash-player` directory.

## Usage

The desired audio stream and render method can be selected using the dropdown menus at the top of the player. Playback can be controlled with the play/pause and seek buttons below the player. While playing, a 3D representation of the rendered audio objects is shown. The scene can be panned and rotated with the left and right mouse buttons respectively.
