import CoordinateHelper from './../../coordinate-helper';
import ChannelHandler from './../../channel-handler';
import Spatialiser from './spatialiser';
import SpatialiserFilterSelector from './spatialiser-filter-selector';


/**
 * A class to render a single audio channel, synchronised to an audio context.
 * Uses the BBC Spatialiser panner node.
 * @example
 * const AudioContext = window.AudioContext || window.webkitAudioContext;
 * const context = new AudioContext();
 * const hrtfs = loadHRTFsFromSomewhere();
 *
 * const channelHandlerFactory = SpatialiserChannelHandler.createFactory(hrtfs);
 * const renderer = new RendererNode(context, 10, channelHandlerFactory);
 * @public
 */
export default class SpatialiserChannelHandler extends ChannelHandler {
  /**
   * Creates the BBC Spatialiser panner node used for rendering.
   * @override
   * @param  {!AudioNode} inputNode
   *         The AudioNode that should connect to the panner.
   * @param  {!AudioNode} ouputNode
   *         The AudioNode the panner should connect to.
   * @param  {!Object} options
   *         An object containing the HRTFs to be used by the panner node.
   */
  _createPanner(inputNode, outputNode, options) {
    this._panner = new Spatialiser(
      this._context, options.filterSelector);
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
    const setPosition = () => {
      // Panner coordinate system has inverted azimuth.
      this._panner.setPosition(position);
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
    const filterSelector = new SpatialiserFilterSelector(hrtfs);
    return (context) => new this(context, { filterSelector });
  }
}
