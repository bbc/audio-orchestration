import VbapChannelHandler from './vbap-channel-handler';

/**
 * A class to render a single audio channel, synchronised to an audio context.
 * Performs VBAP rendering and then down-mixes the multi-speaker output using
 * another {@link ChannelHandler}.
 * @example
 * const AudioContext = window.AudioContext || window.webkitAudioContext;
 * const context = new AudioContext();
 * const hrtfs = loadHRTFsFromSomewhere();
 * const speakers = loadSpeakerConfigurationFromSomewhere();
 *
 * // Performs VBAP rendering and then down-mixes the multi-speaker output to a
 * // binaural signal using the IrcamFirChannelHandler.
 * const ircamFirChannelHandlerFactory =
 *   IrcamFirChannelHandler.createFactory(hrtfs);
 * const bvsChannelHandlerFactory =
 *   BvsChannelHandler.createFactory(speakers, ircamFirChannelHandlerFactory);
 * const renderer = new RendererNode(context, numberOfInputs,
 *   bvsChannelHandlerFactory);
 * @public
 */
export default class BvsChannelHandler extends VbapChannelHandler {
  /**
   * Creates and configures VBAP used for rendering and the
   * {@link ChannelHandler} used for down-mixing.
   * @override
   * @param  {!AudioNode} inputNode
   *         The AudioNode that should connect to the panner.
   * @param  {!AudioNode} ouputNode
   *         The AudioNode the panner should connect to.
   * @param  {!Object} options
   *         An object containing the speakers configuration and a
   *         channelHandlerFactory.
   */
  _createPanner(inputNode, outputNode, options) {
    // Call this method on the super class then disconnect the old VBAP merger.
    super._createPanner(inputNode, outputNode, options);
    this._vbapMerger.disconnect(outputNode);
    this._channelCount = 2;

    this._bvsProcessors = [];
    for (let i = 0; i < this._vbapGainNodes.length; i++) {
      // For each speaker create a channelHandler using the factory provided.
      this._bvsProcessors[i] = options.channelHandlerFactory(this._context);
      this._bvsProcessors[i].setPosition(
        this._vbapSpeakers[i].position, this._context.currentTime);

      // Disconnect gain nodes from merger and reconnect to new channelHandler.
      this._bvsProcessors[i].output.connect(outputNode);
      this._vbapGainNodes[i].disconnect(this._vbapMerger, 0, i);
      this._vbapGainNodes[i].connect(this._bvsProcessors[i].input);
    }
  }

  /**
   * Returns a function that can be called to create an instance of this class.
   * Must be overridden by subclasses.
   * @override
   * @param  {!Array<Object>} speakers
   *         The speakers used for VBAP rendering.
   * @param  {!function()} channelHandlerFactory
   *         A function that takes an {@link AudioContext} as it's first
   *         parameter that returns a constructed instance of a
   *         {@link ChannelHandler}.
   * @return {function()}
   *         A function that takes an {@link AudioContext} as it's first
   *         parameter that returns a constructed instance of this class.
   */
  static createFactory(speakers, channelHandlerFactory) {
    return (context) => new this(context, { speakers, channelHandlerFactory });
  }
}
