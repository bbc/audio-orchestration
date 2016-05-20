import EventTarget from './event-target.js';

/**
 * A class representing a collection of AudioNodes. The collection is defined
 * similarly to a single node; by a context, and number of channel inputs and
 * outputs.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioNode
 * @see https://webaudio.github.io/web-audio-api/#the-audionode-interface
 */
export default class CompoundNode extends EventTarget {
  /**
   * Constructs a new {@link CompoundNode}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the
   *         {@link CompoundNode}.
   */
  constructor(context) {
    super();

    this._context = context;
    this._inputs = [];
    this._outputs = [];
  }

  /**
   * Returns the associated {@link AudioContext}.
   * @return {AudioContext}
   *         The associated {@link AudioContext}.
   */
  get context() {
    return this._context;
  }

  /**
   * Returns the inputs feeding the node.
   * @return {Array<AudioNode>}
   *         The inputs feeding the node.
   */
  get inputs() {
    return this._inputs;
  }

  /**
   * Returns the inputs outputs the node.
   * @return {Array<AudioNode>}
   *         The outputs feeding the node.
   */
  get outputs() {
    return this._outputs;
  }

  /**
   * Connects one output of this node to one input of another node.
   * @param  {!(AudioNode|CompoundNode)} destination
   *         The destination {@link AudioNode} or {@link CompoundNode} to
   *         connect to.
   * @param  {?number} output=0
   *         An index describing the output of the current {@link CompoundNode}
   *         to be connected to the destination.
   * @param  {?number} input=0
   *         An index describing the input of the destination to be connected to
   *         the current {@link CompoundNode}.
   * @return {(AudioNode|CompoundNode)}
   *         A reference to the destination.
   */
  connect(destination, output = 0, input = 0) {
    if (destination instanceof CompoundNode) {
      this._outputs[output].connect(destination._inputs[input]);
    } else {
      this._outputs[output].connect(destination, 0, input);
    }

    return destination;
  }

  /**
   * Disonnects one output of this node from one input of another node.
   * @param  {AudioNode|CompoundNode} destination
   *         The destination {@link AudioNode} or {@link CompoundNode} to
   *         disconnect from.
   * @param  {?number} output=0
   *         An index describing the output of the current {@link CompoundNode}
   *         to be disconnected from the destination.
   * @param  {?number} input=0
   *         An index describing the input of the destination to be disconnected
   *         from the current {@link CompoundNode}.
   * @return {AudioNode|CompoundNode}
   *         A reference to the destination.
   */
  disconnect(destination, output = 0, input = 0) {
    if (destination instanceof CompoundNode) {
      this._outputs[output].disconnect(destination._inputs[input]);
    } else {
      this._outputs[output].disconnect(destination, 0, input);
    }
  }
}
