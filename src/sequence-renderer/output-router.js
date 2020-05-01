/**
 * @class
 * @desc OutputRouter provides an interface for a player to the audio output through some routing.
 *
 * Its input is connected to a stereoPanner node.
 *
 * For stereo devices, this is connected directly the output.
 *
 * For mono devices, the panner output is converted to mono and connected to the output.
 *
 * @example
 * routeAudio = new OutputRouter(audioContext, true, panning);
 * dashSourceNode.outputs[0].connect(routeAudio.input);
 * routeAudio.output.connect(audioContext.destination);
 */
class OutputRouter {
  /**
   * @param {AudioContext} audioContext
   * @param {boolean} isStereo whether the output is treated as stereo (true) or mono (false).
   * @param {number} panning a panning value between -1 and +1
   */
  constructor(audioContext, isStereo, panning) {
    this._audioContext = audioContext;
    this._isStereo = isStereo;
    this._panning = panning;

    /**
     * The input.
     * @type {GainNode}
     */
    this.input = this._audioContext.createGain();

    /**
     * The output.
     * @type {GainNode}
     */
    this.output = this._audioContext.createGain();
    this.initAudioGraph();
  }

  /**
   * Connects the inputs to the output via the panner.
   *
   * @private
   */
  initAudioGraph() {
    const panner = this._audioContext.createStereoPanner();
    panner.pan.value = this._panning;
    this.input.connect(panner);

    if (this._isStereo) {
      panner.connect(this.output);
    } else {
      // Create a mono gain node so we explicitly output one channel here for mono devices
      const monoSum = this._audioContext.createGain();
      monoSum.channelCountMode = 'explicit';
      monoSum.channelCount = 1;

      panner.connect(monoSum);
      monoSum.connect(this.output);
    }
  }
}

export default OutputRouter;
