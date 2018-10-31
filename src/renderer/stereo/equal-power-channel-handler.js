import CoordinateHelper from '../coordinate-helper';
import ChannelHandler from '../channel-handler';

/**
 * A class to render a single audio channel, synchronised to an audio context.
 * Uses the WebAudioAPI panner node configured in equal power mode.
 * @example
 * const AudioContext = window.AudioContext || window.webkitAudioContext;
 * const context = new AudioContext();
 *
 * const channelHandlerFactory = EqualPowerChannelHandler.createFactory();
 * const renderer = new RendererNode(context, 10, channelHandlerFactory);
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
 * @public
 */
export default class EqualPowerChannelHandler extends ChannelHandler {
  /**
   * Creates the WebAudioAPI queal power panner node used for rendering.
   * @override
   * @param  {!AudioNode} inputNode
   *         The AudioNode that should connect to the panner.
   * @param  {!AudioNode} ouputNode
   *         The AudioNode the panner should connect to.
   */
  _createPanner(inputNode, outputNode) {
    // Remove distance model from panner node.
    this._panner = this._context.createPanner();
    this._panner.panningModel = 'equalpower';
    this._panner.maxDistance = 1;

    inputNode.connect(this._panner);
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
      this._panner.setPosition(x, y, z);
      this._position.set(x, y, z);
    };
    return setPosition;
  }

  /**
   * Returns a function that can be called to create an instance of this class.
   * Must be overridden by subclasses.
   * @override
   * @return {function()}
   *         A function that takes an {@link AudioContext} as it's first
   *         parameter that returns a constructed instance of this class.
   */
  static createFactory() {
    return (context) => new this(context);
  }
}
