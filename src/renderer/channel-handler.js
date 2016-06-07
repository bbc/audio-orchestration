import { Vector3 } from 'three';

/**
 * A class to render a single audio channel, synchronised to an audio context.
 * @public
 * @abstract
 */
export default class ChannelHandler {
  /**
   * Constructs a new {@link ChannelHandler}.
   * @param  {!AudioContext} context
   *         The AudioContext that rendering will be synchronised to.
   * @param  {?Object} [options = {}]
   *         An object containing channel handler options.
   */
  constructor(context, options = {}) {
    this._context = context;
    this._options = options;
    this._rampDuration = 5 / 1000; // Seconds.
    this._channelCount = 2;

    this._initAudioGraph();
    this._position = new Vector3();
  }

  /**
   * Gets the input {@link AudioNode}.
   * @public
   * @type {AudioNode}
   *       The input {@link AudioNode}.
   */
  get input() {
    return this._inputGainNode;
  }

  /**
   * Gets the output {@link AudioNode}.
   * @public
   * @type {AudioNode}
   *       The output {@link AudioNode}.
   */
  get output() {
    return this._outputGainNode;
  }

  /**
   * Gets the rendered position in 3D Cartesian space.
   * @public
   * @type {THREE.Vector3}
   *       An object defining the rendered position in 3D Cartesian space.
   */
  get position() {
    return this._position;
  }

  /**
   * Gets the rendered gain.
   * @public
   * @type {number}
   *       The rendered gain.
   */
  get gain() {
    return this._outputGainNode.gain.value;
  }

  /**
   * Sets the gain at the specified time.
   * @param  {!number} gain
   *         The gain value to set.
   * @param  {!number} time
   *         The time at which to set the gain.
   */
  setGain(gain, time) {
    // First set value at scheduled time to this current value, then set ramp
    // to new value at scheduled time plus the ramp duration.
    this._outputGainNode.gain.setValueAtTime(
      this._outputGainNode.gain.value, time);
    this._outputGainNode.gain.linearRampToValueAtTime(
      gain, time + this._rampDuration);
  }

  /**
   * Sets the position at the specified time.
   * @param  {!Object} position
   *         The position to set in ADM position format.
   * @param  {!number} time
   *         The time at which to set the gain.
   */
  setPosition(position, time) {
    const setPositionFunction = this._createPositionFunction(position);
    const timeDiff = (time - this._context.currentTime) * 1000;
    if (timeDiff > 0) {
      setTimeout(setPositionFunction, timeDiff);
    } else {
      setPositionFunction();
    }
  }

  // Not yet implemented.
  // setDiffuseness(diffuseness, time) { }

  // Not yet implemented.
  // setDialogue(dialogue, time) { }

  /**
   * Initialises the required AudioNodes.
   */
  _initAudioGraph() {
    this._inputGainNode = this._context.createGain();
    this._outputGainNode = this._context.createGain();
    this._createPanner(this._inputGainNode, this._outputGainNode,
      this._options);

    this._outputGainNode.channelCount = this._channelCount;
    this._outputGainNode.channelCountMode = 'explicit';
    this._outputGainNode.channelInterpretation = 'discrete';
  }

  /**
   * Creates the panner used for rendering.
   * Must be overridden by subclasses.
   * @abstract
   * @param  {!AudioNode} inputNode
   *         The AudioNode that should connect to the panner.
   * @param  {!AudioNode} ouputNode
   *         The AudioNode the panner should connect to.
   * @param  {!Object} options
   *         An object containing panner node options.
   */
  _createPanner() { }

  /**
   * Creates a function that can be called to set the position.
   * Must be overridden by subclasses.
   * @abstract
   * @param  {!Object} position
   *         The position to set in ADM position format.
   * @return {function()}
   *         A paramater-less function that can be called to set the position.
   */
  _createPositionFunction() { }

  /**
   * Returns a function that can be called to create an instance of this class.
   * Must be overridden by subclasses.
   * @abstract
   * @return {function()}
   *         A function that takes an {@link AudioContext} as it's first
   *         parameter that returns a constructed instance of this class.
   */
  static createFactory() { }
}
