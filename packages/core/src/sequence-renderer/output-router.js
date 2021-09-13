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
   * @param {number} panning a panning value between -1 and +1
   */
  constructor(audioContext, panning) {
    this._audioContext = audioContext;
    this._panning = panning;

    /**
     * The input for mono sources to be panned
     * @type {GainNode}
     */
    this.input = this._audioContext.createGain();

    /**
     * The input for stereo sources, to bypass the panner
     * @type {GainNode}
     */
    this.stereoInput = this._audioContext.createGain();

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
    let panner;

    this.stereoInput.connect(this.output);

    if (this._audioContext.createStereoPanner) {
      // If available, use a simple StereoPannerNode
      panner = this._audioContext.createStereoPanner();
      panner.pan.value = this._panning;
      this.input.connect(panner);
    } else {
      // TODO this manual implementation of panning algorithm only works for mono sources!
      // Spec: https://webaudio.github.io/web-audio-api/#stereopanner-algorithm

      // Steps 1-3: clamp to [-1, 1] and then normalise to [0, 1]
      const x = (Math.min(Math.max(-1, this._panning), 1) + 1) / 2;

      // Create gain nodes
      const gainLeft = this._audioContext.createGain();
      const gainRight = this._audioContext.createGain();

      // Step 4: calculate gain values

      gainLeft.gain.value = Math.cos(x * (Math.PI / 2));
      gainRight.gain.value = Math.sin(x * (Math.PI / 2));

      // Step 5: connect mono input to both gain nodes
      this.input.connect(gainLeft);
      this.input.connect(gainRight);

      // Create and connect a channel merger for combining left and right channels to stereo output
      const merger = this._audioContext.createChannelMerger();
      gainLeft.connect(merger, 0, 0);
      gainRight.connect(merger, 0, 1);

      // Assign merger to panner so its output can be used below.
      panner = merger;
    }

    panner.connect(this.output);
  }
}

export default OutputRouter;
