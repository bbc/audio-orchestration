import { Loader } from '../../../core/_index';
import SegmentStream from './segment-stream';

/**
 * A class to manage a single stream of headerless audio segments, synchronised
 * to an audio context.
 * @ignore
 */
export default class HeaderlessAudioSegmentStream extends SegmentStream {
  /**
   * Constructs a new {@link HeaderlessAudioSegmentStream}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Object} definition
   *         An object that defines the stream parameters.
   */
  constructor(context, definition) {
    super(context, new Loader('arraybuffer'), definition);

    this._isStreaming = false;
    this._stream.channelCount = definition.channelCount;
    this._output = this._context.createChannelSplitter(this.channelCount);
  }

  /**
   * Gets the ouput AudioNode.
   * @return {AudioNode}
   *         The ouput AudioNode.
   */
  get output() {
    return this._output;
  }

  /**
   * Returns the number of channels in the stream.
   * @return {Number}
   *         The number of channels in the stream.
   */
  get channelCount() {
    return this._stream.channelCount;
  }

  /**
   * Schedules all audio in the buffer for playback and starts streaming of the
   * audio region defined by prime.
   */
  _start() {
    // Set as streaming and schedule all audio in the buffer.
    this._isStreaming = true;
    this._buffer.segments.forEach((segment) => {
      this._startSegment(segment);
    });

    super._start();
  }

  /**
   * Stops all audio in the buffer and starts streaming of the audio region
   * defined by prime.
   */
  _stop() {
    // Set as no longer streaming then stop all audio in the buffer.
    this._isStreaming = false;
    this._buffer.segments.forEach((segment) => {
      if (segment && segment.bufferSource) {
        segment.bufferSource.stop();
      }
    });

    super._stop();
  }


  /**
   * Schedules a single segment for playback.
   * @param  {!Object} segment
   *         The segment to schedule.
   */
  _startSegment(segment) {
    if (segment && segment.bufferSource) {
      // Adjust the parameters when, offset and duration for the context time.
      const when = segment.when + this._contextSyncTime;
      const offset = segment.offset +
        (segment.number === this._play.startSegment ?
          0 : segment.bufferSource.buffer.duration / 2);
      const duration = segment.duration;

      // Calculate any lateness in playback.
      const playOffset = this._context.currentTime - when;

      // If the segment is entirely too late for playback, play for a duration
      // of 0 as all segments in the buffer must be played in order to avoid
      // calling stop on a segment that has not yet been played. Currently there
      // is no way to detect if a segment has been played already. If the
      // segment is only slightly late then play as much as possible. Otherwise;
      // play the entire segment.
      if (playOffset < segment.duration) {
        const osWhen = playOffset > 0 ? 0 : when;
        const osOffset = playOffset > 0 ? offset + playOffset : offset;
        const osDuration = playOffset > 0 ? duration - playOffset : duration;

        segment.bufferSource.start(osWhen, osOffset, osDuration);
        // console.log(this._context.currentTime, 'Segment', segment.number,
        //   'scheduled for ', osWhen, osOffset, osDuration);
      } else {
        segment.bufferSource.start(0, 0, 0);
        // console.log(this._context.currentTime, 'Segment', segment.number,
        //   'scheduled for ', 0, 0, 0);
      }
    }
  }

  /*
   * Merges all passed buffers into a single buffer.
   */
  _mergeBuffers(...buffers) {
    const mergedLength = buffers.reduce(
      (length, buffer) => length + buffer.byteLength, 0);
    const mergedArray = new Uint8Array(mergedLength);

    let currentOffset = 0;
    buffers.forEach((buffer) => {
      mergedArray.set(new Uint8Array(buffer), currentOffset);
      currentOffset += buffer.byteLength;
    });

    return mergedArray.buffer;
  }

  /**
   * Decodes the segment data and constructs a BufferSourceNode. If the stream
   * is currently streaming then the segment is scheduled for playback on the
   * AudioContext. Streaming audio requires the previous segment in order to
   * decode the current.
   * @param  {!Object} prevSegment
   *         The segment that should be used to decode segment.
   * @param  {!Object} segment
   *         The segment that should be decoded using prevSegment segment.
   */
  _mergeBuffersToSegment(prevSegment, segment) {
    /* eslint-disable no-param-reassign */
    if (segment && segment.data && !segment.isDecoded && (prevSegment &&
      prevSegment.data || segment.number === this._play.startSegment)) {
      segment.isDecoded = true;

      const arrayBuffer = segment.number === this._play.startSegment ?
        this._mergeBuffers(this._buffer.init, segment.data) :
        this._mergeBuffers(this._buffer.init, prevSegment.data, segment.data);

      this._context.decodeAudioData(arrayBuffer,
        (decodedAudio) => {
          segment.bufferSource = this._context.createBufferSource();
          segment.bufferSource.buffer = decodedAudio;
          segment.bufferSource.connect(this._output);

          if (this._isStreaming) {
            this._startSegment(segment);
          }
        },
        (error) => {
          // eslint-disable-next-line no-console
          console.log('Could nto decode audio data:', error);
        });
    }
    /* eslint-enable no-param-reassign */
  }

  /**
   * Constructs a BufferSourceNode from the audio data and adds to a segment
   * in the stream buffer. If the stream is currently streaming then the segment
   * is scheduled for playback on the AudioContext.
   * @param  {!Object} data
   *         The data to add to the segment.
   * @param  {!number} n
   *         The number of the segment in the playback sequence.
   * @return {Object}
   *         The complete segment.
   */
  _addDataToSegment(data, n) {
    const segment = this._buffer.segments.find((s) => s.n === n);

    if (segment) {
      segment.data = data;

      const prevSegment = this._buffer.segments.find((s) => s.n === n - 1);
      const nextSegment = this._buffer.segments.find((s) => s.n === n + 1);

      this._mergeBuffersToSegment(prevSegment, segment);
      this._mergeBuffersToSegment(segment, nextSegment);
    }

    return segment;
  }

  prime(initial = 0, loop = false, offset = 0,
    duration = this._stream.duration - offset) {
    return this._loader.load(this._stream.initUrl)
      .then((data) => { this._buffer.init = data; })
      .then(super.prime(initial, loop, offset, duration));
  }
}
