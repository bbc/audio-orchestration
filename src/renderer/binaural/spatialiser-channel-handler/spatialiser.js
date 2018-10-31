import ConvolverAudioGraph from './spatialiser-convolver';

/**
 * A class to spatialise audio. Takes a single one-channel input and outputs a
 * single two-channel binaural mix. Uses a SpatialiserFilterSelector to provide
 * HRTFs for producing the binaural mix.
 * @private
 * @ignore
 */
export default class Spatialiser {
  /**
   * Constructs a new {@link Spatialiser}.
   * @param  {!AudioContext} context
   *         The AudioContext used to contruct the {@link Spatialiser}.
   * @param  {!SpatialiserFilterSelector} filterSelector
   *         The {@link SpatialiserFilterSelector} used to provide HRTFs.
   */
  constructor(context, filterSelector) {
    this._context = context;
    this._filterSelector = filterSelector;

    this._crossfadeDuration = 0.02;
    this._delayScaling = 1.0;
    this._meanDelay = this._filterSelector.hrtfs.meanDelay;
    this._minDelay = this._filterSelector.hrtfs.minDelay;
    this._meanOffset = (this._meanDelay - this._minDelay) * 1.5;
    this._useSeperateDelays =
      typeof filterSelector.hrtfs.meanDelay === 'number';

    this._position = {};
    this._filter = undefined;
    this._pendingPosition = undefined;
    this._pendingFilter = undefined;

    this._state = 'A';  // States in ["A", "B", "A2B", "B2A"]
    this._target = undefined;

    // Initialise the audio graph.
    this._input = this._context.createGain();

    this._convolverA = new ConvolverAudioGraph(this._context,
      this._useSeperateDelays);
    this._convolverA.gain.value = 1;
    this._input.connect(this._convolverA.input);

    this._convolverB = new ConvolverAudioGraph(this._context,
      this._useSeperateDelays);
    this._convolverB.gain.value = 0;
    this._input.connect(this._convolverB.input);
  }

  /**
   * Connects the {@link Spatialiser} to a Web Audio API AudioNode.
   * @chainable
   * @param  {!audioNode} node
   *         A Web Audio API AudioNode.
   */
  connect(node) {
    this._convolverA.connect(node);
    this._convolverB.connect(node);
    return node;
  }

  /**
   * Disconnect the {@link Spatialiser} from a Web Audio API AudioNode.
   * @chainable
   * @param  {!audioNode} node
   *         A Web Audio API AudioNode.
   */
  disconnect(node) {
    this._convolverA.disconnect(node);
    this._convolverB.disconnect(node);
    return node;
  }

  /**
   * Gets the current position of the {@link Spatialiser}.
   * @return {Object}
   *         A coordinate in BBCAT Cartesian or polar form.
   */
  getPosition() {
    return this._position;
  }

  /**
   * Sets the position of the {@link Spatialiser}.
   * @param  {!Object} position
   *         A coordinate in BBCAT Cartesian or polar form.
   */
  setPosition(position) {
    const filter = this._filterSelector.getHrtfForPosition(position);
    this._setPosition(position, filter, false);
  }

  /**
   * Sets the position of the {@link Spatialiser}.
   * @param  {!Object} position
   *         A coordinate in BBCAT Cartesian or polar form.
   * @param  {!AudioBuffer} filter
   *         The filter/buffer to use for the position.
   * @param  {!boolean} force
   *         If false only set the position if it differs from current.
   *         Otherwsise; perform the position change (crossfade) regardless.
   */
  _setPosition(position, filter, force = false) {
    // If there is currently no change in progress.
    if (this._state === 'A' || this._state === 'B') {
      // If set position is forced or the filter is different.
      if (force === true || filter !== this._filter) {
        // Crossfade to the idle convolver group.
        if (this._state === 'A') {
          this._state = 'A2B';
          this._crossfadeTo('B', filter);
        } else { // this._state === 'B'
          this._state = 'B2A';
          this._crossfadeTo('A', filter);
        }
      }

      this._filter = filter;
      this._position = position;
      this._pendingFilter = undefined;
      this._pendingPosition = undefined;
    } else {
      this._pendingFilter = filter;
      this._pendingPosition = position;
    }
  }

  /**
   * Performs a crossfade to the target convolver and sets the convolver buffer.
   * @param  {!string} target
   *         The convolver to crassfade to, 'A' or 'B'.
   * @param  {!AudioBuffer} filter
   *         The filter/buffer to set on the target convolver.
   */
  _crossfadeTo(target, filter) {
    const now = this._context.currentTime;
    const next = now + this._crossfadeDuration;

    this._target = target;
    if (this._target === 'A') {
      this._convolverA.buffer = filter.buffer;
      if (this._useSeperateDelays && filter.toas !== undefined) {
        this._convolverA.delays = this._scaleDelays(filter.toas);
      }
      this._convolverB.gain.linearRampToValueAtTime(0, next);
      this._convolverA.gain.linearRampToValueAtTime(1, next);
    } else if (this._target === 'B') {
      this._convolverB.buffer = filter.buffer;
      if (this._useSeperateDelays && filter.toas !== undefined) {
        this._convolverB.delays = this._scaleDelays(filter.toas);
      }
      this._convolverA.gain.linearRampToValueAtTime(0, next);
      this._convolverB.gain.linearRampToValueAtTime(1, next);
    }

    const crossfadeCompleteIntervalFunction = () => {
      if (this._context.currentTime > next) {
        clearInterval(this._crossfadeCompleteInterval);

        // Target state is reached.
        this._state = this._target;
        this._target = undefined;

        // Trigger pending position if there is one.
        if (this._pendingPosition && this._pendingFilter) {
          this._setPosition(this._pendingPosition, this._pendingFilter);
        }
      }
    };

    this._crossfadeCompleteInterval = setInterval(
      crossfadeCompleteIntervalFunction.bind(this), 10);
  }

  /**
   * Applies the scale factor to HRTF delays.
   * @param  {!Array<number>} delays
   *         The HRTF delays to be scaled. Shuld be an array of length two.
   * @return {Array<number>}
   *         The scaled HRTF delays.
   */
  _scaleDelays(delays) {
    return [
      (delays[0] - this._meanDelay) * this._delayScaling + this._meanOffset,
      (delays[1] - this._meanDelay) * this._delayScaling + this._meanOffset,
    ];
  }

  /**
   * Gets the scale factor applied to the HRTF delays, if present.
   * @type  {number}
   */
  get delayScaling() {
    return this._delayScaling;
  }

  /**
   * Sets the scale factor applied to the HRTF delays, if present.
   * @type  {number}
   */
  set delayScaling(value) {
    this._delayScaling = value;

    // Force an update if possible.
    if (this._pendingPosition && this._pendingFilter) {
      this._setPosition(this._pendingPosition, this._pendingFilter, true);
    } else if (this._position && this._filter) {
      this._setPosition(this._position, this._filter, true);
    }
  }

  /**
   * Gets the duration of crossfading in seconds.
   * @type  {number}
   */
  get crossfadeDuration() {
    return this._crossfadeDuration;
  }

  /**
   * Sets the duration of crossfading in seconds.
   * @type  {number}
   */
  set crossfadeDuration(value) {
    this._crossfadeDuration = value;
  }

  /**
   * The {@link AudioNode} input.
   * @type  {AudioNode}
   */
  get input() {
    return this._input;
  }
}
