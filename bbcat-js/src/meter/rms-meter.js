import CompoundNode from '../core/compound-node';

/**
 * A class to measure the RMS a connected stereo signal. Note that the input is
 * mixed to mono, and will give inappropriate results for signals with strong
 * out-of-phase components in left and right.
 * @extends {CompoundNode}
 * @example
 * const context = new AudioContext();
 * const source = context.createBufferSource();
 * const rmsMeter = new bbcat.meter.RmsMeter(context);
 *
 * new bbcat.core.AudioLoader(context)
 * .load('./some/example/audio.mp4')
 * .then((audio) => {
 *   source.buffer = audio;
 *   source.start(0);
 * });
 *
 * source.connect(context.destination);
 * source.connect(rmsMeter.input);
 *
 * // Log the RMS value to the console every second.
 * setInterval(() => { console.log(rmsMeter.rms); }, 1000));
 */
export default class RmsMeter extends CompoundNode {
  /**
   * Constructs a new {@link RmsMeter}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the {@link RmsMeter}.
   */
  constructor(context) {
    super(context);
    this._rmsValue = 0;

    // Create script processor and connect to destination as audio process
    // will only fire when work outputs are not left floating.
    this._scriptProcessor = this.context.createScriptProcessor(256, 2, 2);
    this._scriptProcessor.onaudioprocess = this._audioProcess.bind(this);
    this._scriptProcessor.connect(this.context.destination);
    this.inputs.push(this._scriptProcessor);
  }

  /**
   * Smoothes the transition between two values using a smothing coefficient.
   * @param  {!number} previousValue
   *         The value to transition from.
   * @param  {!number} targetValue
   *         The value to transition to.
   * @param  {!number} alpha
   *         The coefficient of smoothing.
   * @return {number}
   *         The smoothed value.
   */
  _smooth(previousValue, targetValue, alpha) {
    return (alpha * previousValue + (1 - alpha) * targetValue);
  }

  /**
   * A method to be used by a ScriptProcessorNode to measure input RMS.
   * @param  {!e} AudioProcessEvent
   *         The {@link AudioProcessEvent}.
   */
  _audioProcess(e) {
    const inputBufferL = e.inputBuffer.getChannelData(0);
    const inputBufferR = e.inputBuffer.getChannelData(1);

    let sumOfSquares = 0;
    for (let i = 0; i < e.inputBuffer.length; i++) {
      // Accumulate the sum of the squares.
      sumOfSquares += Math.pow((inputBufferL[i] + inputBufferR[i]) / 2, 2);
    }

    // Divide the sum by the number of samples to give mean, and calculate square root.
    const rootMean = Math.sqrt(sumOfSquares / e.inputBuffer.length);
    // Apply an exponential moving average filter to smooth the jumps in the
    // RMS value caused by processing in blocks.
    this._rmsValue = this._smooth(this._rmsValue, rootMean, 0.98);
  }

  /**
   * Returns the RMS measure.
   * @type   {number}
   *         The RMS measure.
   */
  get rms() {
    return this._rmsValue;
  }
}
