import CoordinateHelper from '../coordinate-helper';
import ChannelHandler from '../channel-handler';
import Vbap from './vbap';
// import { Vector3 } from 'three';

/**
 * A class to render a single audio channel, synchronised to an audio context.
 * Performs VBAP rendering to a multi-speaker array
 * @example
 * const AudioContext = window.AudioContext || window.webkitAudioContext;
 * const context = new AudioContext();
 * const speakers = loadSpeakerConfigurationFromSomewhere();
 *
 * const channelHandlerFactory = VbapChannelHandler.createFactory(speakers);
 * const renderer = new RendererNode(context, 10, channelHandlerFactory);
 * @public
 */
export default class VbapChannelHandler extends ChannelHandler {
  /**
   * Creates and configures VBAP used for rendering.
   * @override
   * @param  {!AudioNode} inputNode
   *         The AudioNode that should connect to the panner.
   * @param  {!AudioNode} ouputNode
   *         The AudioNode the panner should connect to.
   * @param  {!Object} options
   *         An object containing the speakers configuration.
   */
  _createPanner(inputNode, outputNode, options) {
    this._vbapSpeakers = options.speakers;
    this._vbap = new Vbap(this._vbapSpeakers);

    // The channel count is the number of non-virtual speakers. As virtual
    // speakers have a channel of -1, the channel count is the highest channel
    // present in the speakers array (plus one as channels start from zero.)
    this._channelCount = this._vbapSpeakers
      .reduce((n, speaker) => Math.max(n, speaker.channel + 1), 1);

    // Create a merger node to combine single-channel multiple-inputs for
    // calculated speakers into multi-channel single-output.
    this._vbapMerger = this._context.createChannelMerger(this._channelCount);
    this._vbapMerger.connect(outputNode);

    // Create a gain node for each speaker and connect to input and merger.
    this._vbapGainNodes = [];
    for (let i = 0; i < this._channelCount; i++) {
      this._vbapGainNodes[i] = this._context.createGain();
      this._vbapGainNodes[i].connect(this._vbapMerger, 0, i);
      inputNode.connect(this._vbapGainNodes[i]);
    }
  }

  /**
   * Sets the position at the specified time.
   * @override
   * @param  {!Object} position
   *         The position to set in ADM position format.
   * @param  {!number} time
   *         The time at which to set the gain.
   */
  setPosition(position, time) {
    const {
      x,
      y,
      z,
    } = CoordinateHelper.convertToADMCartesian(position);
    this._nextPosition.set(x, y, z);
    this._nextPositionTime = time;

    // Apply transform.
    let positionRot = this._applyTransform(position);
    positionRot = CoordinateHelper.convertToADMCartesian(positionRot);

    // Get the target speaker gains from VBAP.
    const targetGains = this._vbap.pan(positionRot);

    // Apply each gain to the respective speaker.
    for (let i = 0; i < this._vbapGainNodes.length; i++) {
      this._vbapGainNodes[i].gain.setValueAtTime(
        this._vbapGainNodes[i].gain.value, time);
      this._vbapGainNodes[i].gain.linearRampToValueAtTime(
        targetGains[i], time + this._rampDuration);
    }

    // Update the position parameter at the desired time
    // (acutal update handled with gain node automation above).
    // const nextPosition = {
    //   polar: false,
    //   x: x,
    //   y: y,
    //   z: z,
    // };
    const nextPosition = { x, y, z };
    const setPositionFunction = this._createPositionFunction(nextPosition);
    const timeDiff = (time - this._context.currentTime) * 1000;
    if (timeDiff > 0) {
      setTimeout(setPositionFunction, timeDiff);
    } else {
      setPositionFunction();
    }
  }

  /**
   * Creates a function that can be called to set the position.
   * @override
   * @param  {!Object} position
   *         The position to set in ADM position format.
   * @return {function()}
   *         A paramater-less function that can be called to set the position.
   */
  _createPositionFunction(position) {
    const {
      x,
      y,
      z,
    } = CoordinateHelper.convertToADMCartesian(position);
    return () => {
      this._position.set(x, y, z);
    };
  }

  /**
   * Returns a function that can be called to create an instance of this class.
   * Must be overridden by subclasses.
   * @override
   * @param  {!Array<Object>} speakers
   *         The speakers used for VBAP rendering.
   * @return {function()}
   *         A function that takes an {@link AudioContext} as it's first
   *         parameter that returns a constructed instance of this class.
   */
  static createFactory(speakers) {
    return (context) => new this(context, {
      speakers,
    });
  }
}
