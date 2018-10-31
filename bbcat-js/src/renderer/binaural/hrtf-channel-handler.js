import EqualPowerChannelHandler from '../stereo/equal-power-channel-handler';

/**
 * A class to render a single audio channel, synchronised to an audio context.
 * Uses the WebAudioAPI panner node configured in HRTF mode.
 * @example
 * const AudioContext = window.AudioContext || window.webkitAudioContext;
 * const context = new AudioContext();
 *
 * const channelHandlerFactory = HrtfChannelHandler.createFactory();
 * const renderer = new RendererNode(context, 10, channelHandlerFactory);
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
 * @public
 */
export default class HrtfChannelHandler extends EqualPowerChannelHandler {
  /**
   * Creates the WebAudioAPI panner node used for rendering.
   * @override
   * @param  {!AudioNode} inputNode
   *         The AudioNode that should connect to the panner.
   * @param  {!AudioNode} ouputNode
   *         The AudioNode the panner should connect to.
   */
  _createPanner(inputNode, outputNode) {
    super._createPanner(inputNode, outputNode);
    this._panner.panningModel = 'HRTF';
  }
}
