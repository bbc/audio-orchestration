import CompoundNode from '../core/compound-node';

/**
 * A class to perform KFiltering as described in ITU-R BS.1770. KFiltering
 * is a two stage filter consisting of a spherical head model shelf filter
 * followed by a RLB high pass filter.
 * @private
 * @ignore
 * @see https://www.itu.int/rec/R-REC-BS.1770-4-201510-I/en
 */
class KFilter {
  /**
   * Constructs a new {@link KFilter}.
   */
  constructor() {
    // Filter coefficient. Specified in ITU-R BS.1770, Tables 1 & 2.
    // Coefficients for the spherical head model shelf filter.
    this.a0Shelf = 1.0;
    this.a1Shelf = -1.69065929318241;
    this.a2Shelf = 0.73248077421585;

    this.b0Shelf = 1.53512485958697;
    this.b1Shelf = -2.69169618940638;
    this.b2Shelf = 1.19839281085285;

    // Coefficients for the RLB high pass filter.
    this.a0HighPass = 1.0;
    this.a1HighPass = -1.99004745483398;
    this.a2HighPass = 0.99007225036621;

    this.b0HighPass = 1.0;
    this.b1HighPass = -2.0;
    this.b2HighPass = 1.0;

    // Delay elements in the filters.
    this.delay1Shelf = 0;
    this.delay2Shelf = 0;
    this.delay1HighPass = 0;
    this.delay2HighPass = 0;
  }

  /**
   * Applies the filter over the input array.
   * @param  {!Array<number>} input
   *         A one-dimensional array of samples to filter.
   * @return {Array<number>}
   *         A one-dimensional array of filtered samples.
   */
  filter(input) {
    const output = [];
    // Filter 1 - Spherical head model shelf filter.
    for (let i = 0; i < input.length; i++) {
      const nextInput = input[i];
      output[i] = (this.b0Shelf / this.a0Shelf) * nextInput +
        (this.b1Shelf / this.a0Shelf) * this.delay1Shelf +
        (this.b2Shelf / this.a0Shelf) * this.delay2Shelf -
        (this.a1Shelf / this.a0Shelf) * this.delay1Shelf -
        (this.a2Shelf / this.a0Shelf) * this.delay2Shelf;

      this.delay2Shelf = this.delay1Shelf;
      this.delay1Shelf = nextInput;
    }

    // Filter 2 - RLB high pass filter.
    for (let i = 0; i < input.length; i++) {
      const nextInput = output[i];
      output[i] = (this.b0HighPass / this.a0HighPass) * nextInput +
        (this.b1HighPass / this.a0HighPass) * this.delay1HighPass +
        (this.b2HighPass / this.a0HighPass) * this.delay2HighPass -
        (this.a1HighPass / this.a0HighPass) * this.delay1HighPass -
        (this.a2HighPass / this.a0HighPass) * this.delay2HighPass;

      this.delay2HighPass = this.delay1HighPass;
      this.delay1HighPass = nextInput;
    }

    return output;
  }
}

/**
 * A class to measure the loudness of a connected stereo signal as described in
 * ITU-R BS.1770. Loudness may be polled in Loudness Units relative to Full
 * Scale (LUFS) or Sound Pressure Level (SPL).
 * @see https://www.itu.int/rec/R-REC-BS.1770-4-201510-I/en
 * @extends {CompoundNode}
 * @example
 * const context = new AudioContext();
 * const source = context.createBufferSource();
 * const loudnessMeter = new bbcat.meter.LoudnessMeter(context);
 *
 * new bbcat.core.AudioLoader(context)
 * .load('./some/example/audio.mp4')
 * .then((audio) => {
 *   source.buffer = audio;
 *   source.start(0);
 * });
 *
 * source.connect(context.destination);
 * source.connect(loudnessMeter.input);
 *
 * // Log the loudness (SPL) value to the console every second.
 * setInterval(() => { console.log(loudnessMeter.spl); }, 1000));
 */
export default class LoudnessMeter extends CompoundNode {
  /**
   * Constructs a new {@link LoudnessMeter}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the {@link LoudnessMeter}.
   */
  constructor(context) {
    super(context);
    this._filter = new KFilter();

    this._windowSamples = Math.round(3 * this.context.sampleRate);
    this._windowBufferIdx = 0;
    this._windowBuffer = [];
    this._windowSum = 0;

    for (let i = 0; i < this._windowSamples; i++) {
      this._windowBuffer[i] = 0;
    }

    // Create script processor and connect to destination as audio process
    // will only fire when work outputs are not left floating.
    this._scriptProcessor = this.context.createScriptProcessor(512, 2, 2);
    this._scriptProcessor.onaudioprocess = this._audioProcess.bind(this);
    this._scriptProcessor.connect(this.context.destination);
    this.inputs.push(this._scriptProcessor);
  }

  /**
   * A method to be used by a ScriptProcessorNode to measure input loudness.
   * @param  {!e} AudioProcessEvent
   *         The {@link AudioProcessEvent}.
   */
  _audioProcess(e) {
    const inputBufferL = e.inputBuffer.getChannelData(0);
    const inputBufferR = e.inputBuffer.getChannelData(1);

    // Downmix to mono before calculating loudness.
    const mono = [];
    for (let i = 0; i < inputBufferL.length; i++) {
      mono[i] = (inputBufferL[i] + inputBufferR[i]) / 2;
    }

    const filteredInput = this._filter.filter(mono);
    for (let i = 0; i < filteredInput.length; i++) {
      // BS.1770 meter uses mean squared sample values
      const newValue = filteredInput[i] * filteredInput[i];
      const oldValue = this._windowBuffer[this._windowBufferIdx];

      this._windowSum = this._windowSum + newValue - oldValue;
      this._windowBuffer[this._windowBufferIdx] = newValue;

      this._windowBufferIdx++;
      if (this._windowBufferIdx >= this._windowBuffer.length) {
        this._windowBufferIdx = 0;
      }
    }
  }

  /**
   * Returns the loudness measure in Loudness Units relative to Full Scale (LUFS).
   * @type   {number}
   *         The loudness measure in Loudness Units relative to Full Scale (LUFS).
   */
  get lufs() {
    // Calculate a loudness measurement from the current window. Take 10log10,
    // and offset the mean square to compensate for filter gain at 1kHz to
    // calculate LUFS (ITU-R BS.1770).
    const meanSquare = this._windowSum / this._windowSamples;
    return -0.691 + (10 * Math.log(meanSquare) / Math.LN10);
  }

  /**
   * Returns the loudness measure as Sound Pressure Level (SPL).
   * @type   {number}
   *         The loudness measure as Sound Pressure Level (SPL).
   */
  get spl() {
    // Add offset to convert from LUFS to an SPL (EBU Tech Doc 3276 supplement 1).
    return this.lufs + 95.27;
  }
}
