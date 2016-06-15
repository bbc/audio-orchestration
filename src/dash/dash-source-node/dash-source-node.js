import { CompoundNode } from '../../core/_index';
import AudioSegmentStream from './streams/audio-segment-stream';
import MetadataSegmentStream from './streams/metadata-segment-stream';

/**
 * An AudioNode to perform DASH playback.
 * @see http://mpeg.chiariglione.org/standards/mpeg-dash
 * @extends {CompoundNode}
 */
export default class DashSourceNode extends CompoundNode {
  /**
   * Constructs a new {@link DashSourceNode}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Object} manifest
   *         A parsed manifest provided by {@link ManifestParser}.
   */
  constructor(context, manifest) {
    super(context);

    // Initialise a list of the audio streams in addition to a list of all
    // streams, allowing easier iteration of the audio streams only.
    this._allStreams = [];
    this._audioStreams = [];
    this._totalChannels = 0;

    // Instantiate information describing the playback region.
    this._presentationDuration = 0;
    this._playbackInitial = 0;
    this._playbackOffset = 0;
    this._playbackDuration = 0;
    this._playbackLoop = false;

    this._contextSyncTime = 0;
    this._initStreams(manifest);
    this._initAudioGraph();
    this._state = 'ready';
  }

  /**
   * Buffers a DASH stream for the parameter-defined region.
   * @param  {?number} [initial=0]
   *         The time into the region playback should start from.
   * @param  {?boolean} [loop=true]
   *         True if playback of the region should loop.
   * @param  {?number} [offset=0]
   *         The time into the performance the region starts.
   * @param  {?number} [duration=presentationDuration-offset]
   *         The duration of the region to play.
   * @return {Promise}
   *         A Promise that resolves when the node is ready for playback.
   */
  prime(initial = 0, loop = false,
    offset = 0, duration = this._presentationDuration - offset) {
    // Return a promise that resolves when all streams are primed. Promise is
    // rejected if node cannot currently be primed.
    return new Promise((resolve, reject) => {
      // Check node state and parse all input paramaters.
      if (this.state !== 'ready') {
        reject('State must be ready before prime() is called.');
        return;
      }

      if (initial < 0 || initial >= duration) {
        reject('Invalid initial. Must be a number less than ' +
          'duration and greater than or equal to 0.');
        return;
      }

      if (!(loop === false || loop === true)) {
        reject('Invalid loop. Must be a boolean.');
        return;
      }

      if (offset < 0 || offset >= this._presentationDuration) {
        reject('Invalid offset. Must be a number less than ' +
          'presentationDuration and greater than or equal to 0.');
        return;
      }

      if (duration <= 0 || duration > this._presentationDuration - offset) {
        reject('Invalid duration. Must be a number less than ' +
          'presentationDuration minus offset and greater than 0.');
        return;
      }

      // Store information describing the playback region.
      this._playbackInitial = initial;
      this._playbackOffset = offset;
      this._playbackDuration = duration;
      this._playbackLoop = loop;
      this._state = 'priming';

      // Prime all streams with the same offset, duration and loop parameters.
      const primeStreamsPromises = this._allStreams.map((stream) =>
        stream.prime(initial, loop, offset, duration));

      Promise.all(primeStreamsPromises).then(() => {
        this._state = 'primed';
        resolve();
      });
    });
  }

  /**
   * Starts playback of the buffered region, synchronised with AudioContext.
   * @param  {?number} [contextSyncTime=context.currentTime]
   *         The context time to synchronise with.
   */
  start(contextSyncTime = this.context.currentTime) {
    if (this.state !== 'primed') {
      return;
    }

    // Start all streams.
    this._contextSyncTime = contextSyncTime;
    const startStreamsPromises = this._allStreams.map((stream) =>
      new Promise((ended) => stream.start(this._contextSyncTime, ended)));

    // Resolve when all streams have completed.
    this._state = 'playing';
    Promise.all(startStreamsPromises).then(() => {
      // Streams playback has been reached.
      this._dispatchEndedEvent();
      this._state = 'ready';
    });
  }

  /**
   * Stops streaming and playback.
   */
  stop() {
    if (this.state !== 'playing') {
      return;
    }

    this._allStreams.forEach((stream) => stream.stop());
    this._state = 'ready';
  }

  /**
   * Get the current performance time in seconds.
   * @type {number}
   *       The current performance time in seconds.
   */
  get playbackTime() {
    return this.state === 'playing' ? (this.context.currentTime -
      this._contextSyncTime + this._playbackInitial) %
      this._playbackDuration + this._playbackOffset : 0;
  }

  /**
   * Get the total performance duration in seconds.
   * @type {number}
   *       The total performance duration time in seconds.
   */
  get presentationDuration() {
    return this._presentationDuration;
  }

  /**
   * Gets the current state.
   * @type {string}
   *       The current state.
   */
  get state() {
    return this._playbackState;
  }

  /**
   * Sets the current state and emits a statechange event.
   * @type {string}
   *       The state.
   */
  set _state(state) {
    // Sets the state and emits an event describing the state change.
    this._playbackState = state;
    this._dispatchStateChangeEvent(state);
  }

  /**
   * Digests the manifest into a set of streams.
   * @param  {!Object} manifest
   *         The DASH Manifest.
   */
  _initStreams(manifest) {
    // Digests the manifest into a set of streams. Each stream manages a buffer
    // for downloaded segments and synchronises scheduling (and playback in the
    // case of audio) to the AudioContext.
    this._presentationDuration = manifest.mediaPresentationDuration;
    const bufferTime = manifest.minBufferTime;
    const baseURL = manifest.baseURL[0];

    manifest.periods.forEach((period) => {
      period.adaptationSets.forEach((adaptationSet) => {
        const template = adaptationSet.segmentTemplate;
        const definition = {
          id: `${period.id}-${adaptationSet.id}`,
          type: adaptationSet.mimeType,
          start: period.start + template.presentationTimeOffset,
          duration: period.duration,
          segmentStart: template.startNumber,
          segmentDuration: template.duration / template.timescale,
          channelCount: adaptationSet.value,
          templateUrl: baseURL + template.media,
          bufferTime,
        };

        if (adaptationSet.mimeType.indexOf('json') > -1) {
          // If type is JSON then create a metadata stream.
          const stream = new MetadataSegmentStream(this.context, definition);
          stream.metadataCallback = this._dispatchMetadataEvent.bind(this);
          this._allStreams.push(stream);
        } else if (adaptationSet.mimeType.indexOf('audio') > -1) {
          // If type is audio then create an audio stream.
          const stream = new AudioSegmentStream(this.context, definition);
          this._audioStreams.push(stream);
          this._allStreams.push(stream);

          // Tally up the total number of channels across all audio streams.
          this._totalChannels += stream.channelCount;
        }
      });
    });
  }

  /**
   * Initialises the required AudioNodes.
   */
  _initAudioGraph() {
    // The DashSourceNode is single-channel, muliple-output. Create and connect
    // a gain node for each channel in each audio stream.
    let input = 0;
    this._audioStreams.forEach((stream) => {
      for (let output = 0; output < stream.output.numberOfOutputs; output++) {
        const gain = this.context.createGain();
        stream.output.connect(gain, output);
        this._outputs[input] = gain;
        input++;
      }
    });
  }

  /**
   * Dispatches an event of type metadata.
   * @emits {metadata}
   * @param  {!Object} metadata
   *         The segment containing metadata.
   */
  _dispatchMetadataEvent(segment) {
    this.dispatchEvent({
      src: this,
      type: 'metadata',
      n: segment.n,
      metadata: segment.metadata,
      when: segment.when,
      offset: segment.offset,
      duration: segment.duration,
    });
  }

  /**
   * Dispatches an event of type statechange.
   * @emits {statechange}
   * @param  {!Object} state
   *         The new state.
   */
  _dispatchStateChangeEvent(state) {
    this.dispatchEvent({
      src: this,
      type: 'statechange',
      state,
    });
  }

  /**
   * Dispatches an event of type ended.
   * @emits {ended}
   */
  _dispatchEndedEvent() {
    this.dispatchEvent({
      src: this,
      type: 'ended',
    });
  }
}
