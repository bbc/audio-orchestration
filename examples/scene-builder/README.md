# BBC Audio Toolkit - Scene Builder

Scene Builder is an example application that allows a user to add audio objects by URL, spatially position them, and change renderer on-the-fly. A simple, pannable 3D representation of the audio objects is displayed.

## Installation

To install:
- Clone the parent `bbcat-js` project.
- Run `npm install` in the `bbcat-js` directory.
- Run `npm install` in the `bbcat-js/examples/scene-builder` directory.

To run:
- Run `npm start` in the `bbcat-js/examples/scene-builder` directory.
- Point a web browser at `http://localhost:8080/`.

## Usage

The scene shows a 3D representation of the audio objects relative to the listener and one-another. The scene can be panned and roated with the left and right mouse buttons resectively.

Sources can be added, manipulated and removed from the scene:
- The _+_ button adds an audio object to the scene.
  - The _Source Description_ field sets a user-friendly name for the audio object.
  - The _Source URL_ field sets the URL of the audio file to use for the object.
  - The poisition of the source can be set with the _Az._, _El._ and _Dis._ sliders.
  - The gain can be set with the _Gn._ slider.
  - The _-_ button removes the object from the scene.
- The dropdown sets the render method used to render the audio scene.
- The _Save_ button saves the configurations to the browser.
- The _Load_ button loads the last configuration saved to the browser.
