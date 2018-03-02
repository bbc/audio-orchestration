/* global AudioWorkletProcessor registerProcessor sampleRate*/

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


class LoudnessProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super(options);
    this._filter = new KFilter();
    this._windowSamples = Math.round(3 * sampleRate);
    this._windowBufferIdx = 0;
    this._windowBuffer = [];
    this._windowSum = 0;
    for (let i = 0; i < this._windowSamples; i++) {
      this._windowBuffer[i] = 0;
    }
  }

  process(inputs) {
    // this is a single stereo input node (all other inputs are ignored)
    const input = inputs[0];
    const inputL = input[0];
    const inputR = input[0];

    // Downmix to mono before calculating loudness.
    const mono = [];
    for (let i = 0; i < inputL.length; i++) {
      mono[i] = (inputL[i] + inputR[i]) / 2;
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
    this._sendData();
    return true;
  }
  // Calculate a loudness measurement from the current window. Take 10log10,
  // and offset the mean square to compensate for filter gain at 1kHz to
  // calculate LUFS (ITU-R BS.1770).
  /**
   * Returns the loudness measure as Sound Pressure Level (SPL).
   * @type   {number}
   *         The loudness measure as Sound Pressure Level (SPL).
   */
  /**
   * Returns the loudness measure in Loudness Units relative to Full Scale (LUFS).
   * @type   {number}
   *         The loudness measure in Loudness Units relative to Full Scale (LUFS).
   */
  _sendData() {
    const meanSquare = this._windowSum / this._windowSamples;
    const lufs = -0.691 + (10 * Math.log(meanSquare) / Math.LN10);
    this.port.postMessage({
      message: 'lufs',
      value: lufs,
    });
    this.port.postMessage({
      message: 'spl',
      value: lufs + 95.27,
    });
  }
}

registerProcessor('loudness-processor', LoudnessProcessor);
