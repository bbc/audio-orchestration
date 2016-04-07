import { CompoundNode } from '../../core/_index';
import AudioSegmentStream from './streams/audio-segment-stream';
import MetadataSegmentStream from './streams/metadata-segment-stream';

export default class DashSourceNode extends CompoundNode {
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

  start(initial = 0, loop = false,
    offset = 0, duration = this._presentationDuration - offset) {
    // Check node state and parse all input paramaters.
    if (this.state !== 'ready') {
      return;
    }

    if (initial < 0 || initial >= duration) {
      throw new Error('Invalid initial. Must be a number less than ' +
        'duration and greater than or equal to 0.');
    }

    if (!(loop === false || loop === true)) {
      throw new Error('Invalid loop. Must be a boolean.');
    }

    if (offset < 0 || offset >= this._duration) {
      throw new Error('Invalid offset. Must be a number less than ' +
        'presentationDuration and greater than or equal to 0.');
    }

    if (duration <= 0 || duration > this._duration - offset) {
      throw new Error('Invalid duration. Must be a number less than ' +
        'presentationDuration minus offset and greater than 0.');
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
      // When all steams are primed, latch the current audio context time and
      // start all streams with the same context sync time.
      this._contextSyncTime = this.context.currentTime;
      this._state = 'playing';

      const startStreamsPromises = this._allStreams.map((stream) =>
        new Promise((resolve) => stream.start(this._contextSyncTime, resolve)));

      Promise.all(startStreamsPromises).then(() => {
        // Streams playback has been reached.
        this._dispatchEndedEvent();
        this._state = 'ready';
      });
    });
  }

  stop() {
    if (this.state !== 'playing') {
      return;
    }

    this._allStreams.forEach((stream) => stream.stop());
    this._state = 'ready';
  }

  get playbackTime() {
    return this.state === 'playing' ? (this.context.currentTime -
      this._contextSyncTime + this._playbackInitial) %
      this._playbackDuration + this._playbackOffset : 0;
  }

  get presentationDuration() {
    return this._presentationDuration;
  }

  get loop() {
    return this._playbackLoop;
  }

  get state() {
    return this._playbackState;
  }

  set _state(state) {
    // Sets the state and emits an event describing the state change.
    this._playbackState = state;
    this._dispatchStateChangeEvent(state);
  }

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
          segmentDuration: Math.floor(template.duration / template.timescale),
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

  _dispatchMetadataEvent(segment) {
    this.dispatchEvent({
      src: this,
      type: 'metadata',
      metadata: segment.metadata,
    });
  }

  _dispatchStateChangeEvent(state) {
    this.dispatchEvent({
      src: this,
      type: 'statechange',
      state,
    });
  }

  _dispatchEndedEvent() {
    this.dispatchEvent({
      src: this,
      type: 'ended',
    });
  }
}
