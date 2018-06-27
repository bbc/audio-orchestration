/**
 * @class
 * @desc The OutputRouter wraps a channel merger node.
 *
 * Its inputs (left, right, and mono) correspond to the channelMapping specified in MDO objects.
 *
 * It does not perform any gain processing; the mono input is routed unchanged to both the left and
 * the right output.
 *
 * TODO: Perhaps it should do gain processing and take a numerical pan value for each input.
 *
 * @example
 * output = new OutputRouter(audioContext, true);
 * dashSourceNode.outputs[0].connect(output.left);
 * dashSourceNode.outputs[1].connect(output.right);
 * dashSourceNode.outputs[2].connect(output.mono);
 *
 * output.output.connect(audioContext.destination);
 */
class OutputRouter {
  /**
   * @param {AudioContext} audioContext
   * @param {boolean} isStereo whether the output is treated as stereo (true) or mono (false).
   */
  constructor(audioContext, isStereo) {
    this._audioContext = audioContext;
    this._isStereo = isStereo;

    /**
     * The left input.
     * @type {GainNode}
     */
    this.left = this._audioContext.createGain();

    /**
     * The left input.
     * @type {GainNode}
     */
    this.right = this._audioContext.createGain();

    /**
     * The mono input.
     * @type {GainNode}
     */
    this.mono = this._audioContext.createGain();

    /**
     * The output.
     */
    this.output = this._audioContext.createGain();
    this.initAudioGraph();
  }

  /**
   * Connects the inputs to the output.
   *
   * @private
   */
  initAudioGraph() {
    if (this._isStereo) {
      // Stereo: left and right routed to their respective output channels, mono to both.
      this._merger = this._audioContext.createChannelMerger(2);
      this.left.connect(this._merger, 0, 0);
      this.right.connect(this._merger, 0, 1);
      this.mono.connect(this.right);
      this.mono.connect(this.left);
    } else {
      // Mono: A single output channel, everything connected to this.
      this._merger = this._audioContext.createChannelMerger(1);
      this.mono.connect(this._merger, 0, 0);
      this.left.connect(this.mono);
      this.right.connect(this.mono);
    }
  }
}

export default OutputRouter;
