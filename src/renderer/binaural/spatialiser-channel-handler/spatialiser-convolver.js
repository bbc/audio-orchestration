import FractionalDelay from 'fractional-delay';

/**
 * A class that constructs an audio graph. Single one-channel input and
 * single two-channel output. A buffer may be set to convolve the input signal.
 * If set to use seperate delays, fractional delays may be applied to each
 * output channel.
 * @ignore
 * @private
 */
export default class SpatialiserConvolver {
  /**
   * Constructs a new {@link SpatialiserConvolver}.
   * @param  {!AudioContext} context
   *         The AudioContext used to contruct the audio graph.
   * @param  {?boolean} [useSeparateDelays=false]
   *         If true; the graph will be constructed to support seperate,
   *         fractional delays. Otherwise; a simpler graph will be constructed
   *         that only supports convolution.
   */
  constructor(context, useSeparateDelays = false) {
    this._context = context;
    this._gainNode = this._context.createGain();
    this._convNode = this._context.createConvolver();
    this._convNode.normalize = false;

    // Add extra audio nodes if using seperate delays.
    if (useSeparateDelays === true) {
      // 20ms (960 samples at 48kHz - should be longer than the buffer size).
      this._maxDelayTime = 0.02;
      this._bufferSize = 512;
      this._delays = [0, 0];

      // Create a delay node for each channel, L and R.
      this._fractionalDelayL = new FractionalDelay(
        this._context.sampleRate, this._maxDelayTime);
      this._fractionalDelayL.setDelay(0);
      this._fractionalDelayR = new FractionalDelay(
        this._context.sampleRate, this._maxDelayTime);
      this._fractionalDelayR.setDelay(0);

      // Create a processor node to action the delays.
      this._delayProcessorNode = this._context
        .createScriptProcessor(this._bufferSize);
      this._delayProcessorNode.onaudioprocess =
        this._delayProcessorNodeFunction.bind(this);
      this._delayProcessorNode.connect(this._convNode);

      // Connect gain node via seperate filter audio nodes.
      this._gainNode.connect(this._delayProcessorNode);
    } else {
      this._gainNode.connect(this._convNode);
    }

    // Hack to force audioParam active when the source is not active
    this.gainOscillatorNode = this._context.createGain();
    this.gainOscillatorNode.gain.value = 0;
    this.gainOscillatorNode.connect(this._gainNode);

    this.oscillatorNode = this._context.createOscillator();
    this.oscillatorNode.connect(this.gainOscillatorNode);
    this.oscillatorNode.start(0);
  }

  /**
   * A function to perform seperate, fractional delays when set as the callback
   * for ScriptProcessorNode.onaudioprocess.
   * @param  {!AudioProcessingEvent} e
   *         The AudioProcessingEvent provided to the callback.
   */
  _delayProcessorNodeFunction(e) {
    const input = e.inputBuffer.getChannelData(0);
    const outputL = e.outputBuffer.getChannelData(0);
    const outputR = e.outputBuffer.getChannelData(1);
    const tempL = new Float32Array(this._fractionalDelayL.process(input));
    const tempR = new Float32Array(this._fractionalDelayR.process(input));

    // TODO: Fork FractionalDelay to write to given array; wasting a copy here.
    for (let i = 0; i < input.length; i++) {
      outputL[i] = tempL[i];
      outputR[i] = tempR[i];
    }
  }

  /**
   * Get the AudioNode input to the audio graph.
   * @type {AudioNode}
   *       The AudioNode input to the audio graph.
   */
  get input() {
    return this._gainNode;
  }

  /**
   * Get the gain applied to the graph input.
   * @type {number}
   *       Gain applied to the graph input.
   */
  get gain() {
    return this._gainNode.gain;
  }

  /**
   * Set the buffer in the convolverNode
   * @type {AudioBuffer}
   *       An AudioBuffer.
   */
  set buffer(value) {
    this._convNode.buffer = value;
  }

  /**
   * Get the delays for each channel, L and R respectively.
   * @type {Array<number>}
   *       Array of delay values for each channel (in sample units.)
   */
  get delays() {
    return this._delays;
  }

  /**
   * Set the delays for each channel, L and R respectively.
   * @type {Array<number>} value
   *       Array of delay values for each channel (in sample units.)
   */
  set delays(value) {
    // TODO: Validate type of values.
    if (this._fractionalDelayL && this._fractionalDelayR && value.length >= 2) {
      this._delays = [value[0], value[1]];
      // Delays are provided in sample units so divide by sample rate.
      this._fractionalDelayL.setDelay(value[0] / this._context.sampleRate);
      this._fractionalDelayR.setDelay(value[1] / this._context.sampleRate);
    }
  }

  /**
   * Connect the SpatialiserConvolver to a node.
   * @param  {!AudioNode} node
   *         An AudioNode to connect to.
   * @chainable
   */
  connect(node) {
    this._convNode.connect(node);
    return node;
  }

  /**
   * Disconnect the SpatialiserConvolver from a node.
   * @param  {!AudioNode} node
   *         An AudioNode to disonnect from.
   * @chainable
   */
  disconnect(node) {
    this._convNode.disconnect(node);
    return node;
  }
}
