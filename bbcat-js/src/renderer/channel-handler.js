import CoordinateHelper from './coordinate-helper';
import { Vector3, Quaternion } from 'three';

/**
 * A class to render a single audio channel, synchronised to an audio context.
 * @public
 * @abstract
 * @example
 * class EqualPowerChannelHandler extends bbcat.renderer.ChannelHandler {
 *   // Override the _createPanner function.
 *   _createPanner(inputNode, outputNode) {
 *     this._panner = this._context.createPanner();
 *     this._panner.panningModel = 'equalpower';
 *     this._panner.connect(outputNode);
 *     inputNode.connect(this._panner);
 *   }
 *
 *   // Override the _createPositionFunction function.
 *   _createPositionFunction(position) {
 *     const { x, y, z } = CoordinateHelper.convertToADMCartesian(position);
 *     const setPosition = () => {
 *       this._panner.setPosition(x, y, z);
 *       this._position.set(x, y, z);
 *     };
 *     return setPosition;
 *   }
 *
 *   // Override the createFactory function.
 *   static createFactory() {
 *     return (context) => new this(context);
 *   }
 * }
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
    this._nextPosition = new Vector3();
    this._nextPositionTime = 0;
    this._transform = new Quaternion();
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
   * Gets the rendered position in 3D Cartesian space.
   * @public
   * @type {THREE.Vector3}
   *       An object defining the rendered position in 3D Cartesian space.
   */
  get transformedPosition() {
    const posT = new Vector3(this._position.x,
      this._position.y,
      this._position.z).applyQuaternion(this._transform);
    return posT;
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
   * Gets the position transform quaternion.
   * @public
   * @type {THREE.Quaternion}
   *       A quaternion defining a position transformation (e.g. rotation).
   */
  get transform() {
    return this._transform;
  }

  /**
   * Sets the gain at the specified time.
   * @param  {!number} gain
   *         The gain value to set.
   * @param  {?number} [time = 0]
   *         The time at which to set the gain. If time is omitted the change
   *         is actioned as soon as posible.
   */
  setGain(gain, time = 0) {
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
   * @param  {?number} [time = 0]
   *         The time at which to set the position. If time is omitted the
   *         change is actioned as soon as posible.
   */
  setPosition(position, time = 0) {
    const { x, y, z } = CoordinateHelper.convertToADMCartesian(position);
    this._nextPosition.set(x, y, z);
    this._nextPositionTime = time;
    const nextPosition = {
      polar: false,
      x: this._nextPosition.x,
      y: this._nextPosition.y,
      z: this._nextPosition.z,
    };

    const setPositionFunction = this._createPositionFunction(nextPosition);
    const timeDiff = (time - this._context.currentTime) * 1000;
    if (timeDiff > 0) {
      setTimeout(setPositionFunction, timeDiff);
    } else {
      setPositionFunction();
    }
  }

  /**
   * Sets the listener transform.
   * @param  {!Object} transform
   *         The listener transform as a THREE.Quaternion.
   */
  setTransform(transform) {
    this._transform = transform;

    const currentPosition = {
      polar: false,
      x: this._position.x,
      y: this._position.y,
      z: this._position.z,
    };

    // if the next position is the same as the current position,
    // then we don't need to subsequently schedule an update
    // otherwise we do because the first call to setPosition
    // overwrites the _nextPosition parameter
    const doNextPos = this._position.equals(this._nextPosition);
    const nextPosition = {
      polar: false,
      x: this._nextPosition.x,
      y: this._nextPosition.y,
      z: this._nextPosition.z,
    };
    const nextPositionTime = this._nextPositionTime;

    this.setPosition(currentPosition, this._context.currentTime);

    if (doNextPos) {
      this.setPosition(nextPosition, nextPositionTime);
    }
  }

  _applyTransform(position) {
    const { x, y, z } = CoordinateHelper.convertToADMCartesian(position);
    const pRot = new Vector3(x, y, z).applyQuaternion(this._transform);
    return {
      polar: false,
      x: pRot.x,
      y: pRot.y,
      z: pRot.z,
    };
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
   * The created function should apply the transform if required.
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
