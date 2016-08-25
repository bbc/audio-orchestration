import CompoundNode from '../core/compound-node';
import LoudnessMeter from '../meter/loudness-meter';
import RmsMeter from '../meter/rms-meter';

/**
 * An AudioNode to perform Adaptive, Personalised Audio Compression: Volume and
 * range of an input programme is ajusted w.r.t. an input background/noise channel.
 * @see http://www.bbc.co.uk/rd/publications/whitepaper290
 * @extends {CompoundNode}
 * @example
 * // Settings to grab input stream from user microphone.
 * // Essentially, turn off parameters that negatively effect APAC.
 * const getUserMediaSettings = {
 *   audio: {
 *     optional: [
 *       // Google's Chrome browser implementation of webRTC includes several audio
 *       // processing functions that need to be disabled, otherwise the loudness
 *       // measurement will be wrong.
 *       { googAutoGainControl: false },
 *       { googAutoGainControl2: false },
 *       { googEchoCancellation: false },
 *       { googEchoCancellation2: false },
 *       { googNoiseSuppression: false },
 *       { googNoiseSuppression2: false },
 *       { googHighpassFilter: false },
 *       { googTypingNoiseDetection: false },
 *       { googAudioMirroring: false },
 *
 *       // W3C documentation suggests the following generic constraints
 *       // http://www.w3.org/TR/mediacapture-streams/
 *       { volume: 1.0 },
 *       { echoCancellation: false },
 *
 *       // The sample rate should be 48000 Hz for weighting filters to be correct
 *       // If it's 44100 kHz, the frequency response will be a bit wrong.
 *       { sampleRate: 48000 },
 *     ],
 *   },
 * };
 *
 * // Atempt to grab user microphone feed.
 * navigator.getUserMedia(
 *   getUserMediaSettings,
 *   (micStream) => {
 *     // Now we have a background/noise feed, setup audio graph.
 *     const context = new AudioContext();
 *     const pgSource = context.createBufferSource();
 *     const bgSource = context.createMediaStreamSource(micStream);
 *     const apacNode = new bbcat.apac.ApacNode(context);
 *
 *     pgSource.connect(apacNode.programmeInput);
 *     bgSource.connect(apacNode.backgroundInput);
 *     apacNode.programmeOutput.connect(context.destination);
 *
 *     // Get and start playback of programme.
 *     new bbcat.core.AudioLoader(context)
 *       .load('./Demo1.m4a')
 *       .then((buffer) => {
 *         pgSource.buffer = buffer;
 *         pgSource.loop = true;
 *         pgSource.start(0);
 *       });
 *   },
 *   (e) => { console.log('GetUserMedia failed:', e); });
 */
export default class ApacNode extends CompoundNode {
  /**
   * Constructs a new {@link ApacNode}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the {@link ApacNode}.
   */
  constructor(context) {
    super(context);

    // "Silence" threshold: replaces SPL less than 30 dB (SPL)
    this._quietThreshold = 30;
    // low signal threshold: replaces RMS lower then -60 dbFS
    this._lowSignalThreshold = -60;
    // A limit on the maximum gain that will be applied
    this._maxAutoVolumeGain = 10;
    // How far, in LU, to aim to keep the programme above the background
    this._targetLoudnessDiff = 6;
    // set by the user to increase or decrease their preferred amount of
    // compression. Not currently modifiable.
    this._multiplier = 1;
    // -7dB for my laptop
    this._micSensitivityCorrection = -7;
    //  0dB for typical "leaky" ear-buds
    this._headphoneIsolationCorrection = 0;
    // -5dB for typical ear-buds with mid-range setting of device volume control
    this._headphoneSensitivityCorrection = -5;
    // noise level (in dB) datum around which changes to the compressor threshold
    // are calculated
    this._compressorThresholdActionLevel = 60;
    this._previousRatio = 2;


    // Public input/output nodes.
    this._backgroundInputNode = this.context.createGain();
    this._programmeInputNode = this.context.createGain();
    this._programmeOutputNode = this.context.createGain();

    this._bgLoudnessMeter = new LoudnessMeter(this.context);
    this._pgLoudnessMeter = new LoudnessMeter(this.context);
    this._rmsMeter = new RmsMeter(this.context);

    this._compressor = context.createDynamicsCompressor();
    // set fixed parameters to values derived from previous studies
    this._compressor.attack.value = 0.0084;
    this._compressor.release.value = 0.08;
    this._compressor.knee.value = 15;
    // set initial values for parameters that will be updated automatically
    this._compressor.ratio.value = 2;
    this._compressor.threshold.value = -30;

    this._autoVolume = context.createGain();
    this._autoVolume.gain.value = 1;

    // Connect the programme signal chain.
    this._programmeInputNode.connect(this._compressor);
    this._compressor.connect(this._autoVolume);
    this._autoVolume.connect(this._programmeOutputNode);

    // Connect the source nodes to their meters.
    this._autoVolume.connect(this._pgLoudnessMeter.input);
    this._backgroundInputNode.connect(this._bgLoudnessMeter.input);
    this._programmeInputNode.connect(this._rmsMeter.input);

    this.inputs.push(this._programmeInputNode);
    this.inputs.push(this._backgroundInputNode);
    this.outputs.push(this._programmeOutputNode);

    window.setInterval(this._updateCompression.bind(this), 3);
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
   * Converts a linear value to decibels (logarithmic).
   * @param  {!number} value
   *         The lineae value to convert.
   * @return {number}
   *         The converted value.
   */
  _lin2dB(value) {
    // If value if less than or equal to zero, return an arbitrary low value.
    // Otherwise; convert the value to decibels.
    return value <= 0 ? -999.0 : 20 * (Math.log(value) / Math.LN10);
  }

  /**
   * Converts decibels (logarithmic) to a linear value.
   * @param  {!number} value
   *         The decibel value to convert.
   * @return {number}
   *         The converted value.
   */
  _db2lin(value) {
    return Math.pow(10, value / 20);
  }

  /*
   * A method that can be looped to manage the gain and compression of the
   * input audio channel w.r.t. the input programmer and input background/noise
   * channel loudnesses.
   */
  _updateCompression() {
    // Get and correct programme and background loudness.
    const bgLoudness = this._bgLoudnessMeter.spl;
    const correctedBgLoudness = Math.max(this._quietThreshold, bgLoudness +
      this._micSensitivityCorrection + this._headphoneIsolationCorrection);

    const pgLoudness = this._pgLoudnessMeter.spl;
    const correctedPgLoudness = Math.max(this._quietThreshold,
      pgLoudness + this._headphoneSensitivityCorrection);

    // Manage gain to keep the programme on target above the background.
    const loudnessDifference = correctedPgLoudness - correctedBgLoudness;
    if (loudnessDifference < this._targetLoudnessDiff) {
      // If loudness differenct is below the target, increase the gain smoothly
      // (with factor 0.998), but not more than the maximum limit set. Enforce
      // the limit on maximum gain to be applied.
      const currentGain = this._lin2dB(this._autoVolume.gain.value);
      const requiredGain = Math.min(this._maxAutoVolumeGain,
        this._targetLoudnessDiff - loudnessDifference);
      const autoVolumeGain = this._smooth(currentGain, requiredGain, 0.998);
      this._autoVolume.gain.value = this._db2lin(autoVolumeGain);
    } else {
      // If loudness differenct is above the target, decrease the gain smoothly
      // (with factor 0.9) to unity (0dB).
      const currentGain = this._lin2dB(this._autoVolume.gain.value);
      const autoVolumeGain = this._smooth(currentGain, 0, 0.9);
      this._autoVolume.gain.value = this._db2lin(autoVolumeGain);
    }

    // Manage compressor threshold and ration according to programme/background loudness.

    // Ratio depends on background noise. The scaling and offset with respect to
    // the background loudness have been determined empirically. Take the user's
    // input (less/more compression) into account - the "multiplier" for ratio.
    // Make sure that ratio does cause expansion.
    const scaledBgLoudness = this._multiplier * 16 *
      Math.pow(correctedBgLoudness / 70 - 3 / 7, 2) + 1;
    const currentRatio = this._compressor.ratio.value;
    const requiredRatio = this._smooth(currentRatio, scaledBgLoudness, 0.95);
    // Clamp ratio value at one or above.
    this._compressor.ratio.value = Math.max(requiredRatio, 1);

    // Threshold depends on programme and background noise.
    const threshold = correctedBgLoudness <= this._compressorThresholdActionLevel ?
      Math.pow(Math.E, -Math.pow(correctedBgLoudness /
        this._compressorThresholdActionLevel - 1, 2) / (2 * 0.7 * 0.7)) :
      2 - Math.pow(Math.E, -Math.pow(correctedBgLoudness /
        this._compressorThresholdActionLevel - 1, 2) / (2 * 0.7 * 0.7));

    const currentRMSValue = Math.max(this._rmsMeter.rms,
      this._db2lin(this._lowSignalThreshold));
    const currentThreshold = this._compressor.threshold.value;
    const requiredThreshold = this._smooth(currentThreshold,
      currentRMSValue * threshold * this._multiplier, 0.95);
    // Clamp threshold value at zero or below.
    this._compressor.threshold.value = Math.min(requiredThreshold, 0);
  }

  /**
   * Returns the input AudioNode the background/noise source should connected to.
   * @type   {AudioNode}
   *         The input AudioNode the background/noise source should connected to.
   */
  get backgroundInput() {
    return this._backgroundInputNode;
  }

  /**
   * Returns the input AudioNode the programme source should connect to.
   * @type   {AudioNode}
   *         The input AudioNode the programme source should connect to.
   */
  get programmeInput() {
    return this._programmeInputNode;
  }

  /**
   * Returns the output AudioNode the adjusted programme is output on.
   * @type   {AudioNode}
   *         The output AudioNode the adjusted programme is output on.
   */
  get programmeOutput() {
    return this._programmeOutputNode;
  }

  /**
   * Returns the compression ratio used to adjust the programme.
   * @type   {number}
   *         The compression ratio used to adjust the programme.
   */
  get compressionRatio() {
    return this._compressor.ratio.value;
  }

  /**
   * Returns the compression threshold used to adjust the programme.
   * @type   {number}
   *         The compression threshold used to adjust the programme.
   */
  get compressionThreshold() {
    return this._compressor.threshold.value;
  }

  /**
   * Returns the gain applied to the programme.
   * @type   {number}
   *         The gain applied to the programme.
   */
  get gain() {
    return this._autoVolume.gain.value;
  }
}
