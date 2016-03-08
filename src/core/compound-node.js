import EventTarget from './event-target.js';

// Should meet to AudioNode interface.
// Mozilla: https://developer.mozilla.org/en-US/docs/Web/API/AudioNode
// W3C: https://webaudio.github.io/web-audio-api/#the-audionode-interface

export default class CompoundNode extends EventTarget {
  constructor(context) {
    super();

    Object.defineProperty(this, "context", {
      value: context,
      writable: false,
      enumerable: false,
      configurable: true
    });

    this.inputs = [];
    this.outputs = [];
  }

  get context() {
    return this.context;
  }

  get numberOfInputs() {
    return this.inputs.length;
  }

  get numberOfOutputs() {
    return this.outputs.length;
  }

  connect(destination, output, input) {
    output || (output = 0);
    input || (input = 0);

    if (destination instanceof CompoundNode) {
      this.outputs[output].connect(destination.inputs[input]);
    } else {
      this.outputs[output].connect(destination, 0, input);
    }

    return destination;
  }

  // TODO: check connection structure.
  // disconnect(destination, output = 0, input = 0) {
  disconnect(destination, output, input) {
    output || (output = 0);
    input || (input = 0);

    if (destination instanceof CompoundNode) {
      this.outputs[output].disconnect(destination.inputs[input]);
    } else {
      this.outputs[output].disconnect(destination, 0, input);
    }
  }
}
