import CoordinateHelper from '../coordinate-helper';
import ChannelHandler from '../channel-handler';
import BinauralFIR from 'binauralfir';

/**
 * A class to render a single audio channel, synchronised to an audio context.
 * Uses the IRCAM BinauralFir panner node configured in HRTF mode.
 * @example
 * const AudioContext = window.AudioContext || window.webkitAudioContext;
 * const context = new AudioContext();
 * const hrtfs = loadHRTFsFromSomewhere();
 *
 * const channelHandlerFactory = IrcamFirChannelHandler.createFactory(hrtfs);
 * const renderer = new RendererNode(context, 10, channelHandlerFactory);
 * @see https://github.com/Ircam-RnD/binauralFIR
 * @see http://ircam-rnd.github.io/binauralFIR/examples/
 * @public
 */
export default class IrcamFirChannelHandler extends ChannelHandler {
  /**
   * Creates the IRCAM BinauralFir panner node used for rendering.
   * @override
   * @param  {!AudioNode} inputNode
   *         The AudioNode that should connect to the panner.
   * @param  {!AudioNode} ouputNode
   *         The AudioNode the panner should connect to.
   * @param  {!Object} options
   *         An object containing the HRTFs to be used by the panner node.
   */
  _createPanner(inputNode, outputNode, options) {
    this._panner = new BinauralFIR({ audioContext: this._context });
    this._panner.HRTFDataset = options.hrtfs;
    inputNode.connect(this._panner.input);
    this._panner.connect(outputNode);
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
    const { x, y, z } = CoordinateHelper.convertToADMCartesian(position);
    const positionRot = this._applyTransform(position);
    const { az, el, d } = CoordinateHelper.convertToADMPolar(positionRot);
    const setPosition = () => {
      // IRCAM polar coordinate system has inverted azimuth.
      this._panner.setPosition(-az, el, d);
      this._position.set(x, y, z);
    };

    return setPosition;
  }

  /**
   * Returns a function that can be called to create an instance of this class.
   * Must be overridden by subclasses.
   * @override
   * @param  {!Array<Object>} hrtfs
   *         The HRTFs used for binaural rendering.
   * @return {function()}
   *         A function that takes an {@link AudioContext} as it's first
   *         parameter that returns a constructed instance of this class.
   */
  static createFactory(hrtfs) {
    return (context) => new this(context, { hrtfs });
  }
}
