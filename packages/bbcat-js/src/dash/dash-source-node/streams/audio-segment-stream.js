import { AudioLoader } from '../../../core/_index';
import SegmentStream from './segment-stream';

/**
 * A class to manage a single stream of audio segments, synchronised to an
 * audio context.
 * @ignore
 */
export default class AudioSegmentStream extends SegmentStream {
  /**
   * Constructs a new {@link AudioSegmentStream}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Object} definition
   *         An object that defines the stream parameters.
   */
  constructor(context, definition) {
    super(context, new AudioLoader(context), definition);

    // The primer offset is required because AudioContext.decodeAudioData cannot
    // currently decode audio segments without fully formed headers. This will
    // not be required in a future Web Audio API update.
    // this._primerOffset = 2048 / this._context.sampleRate;
    // HACK - to be resolved defaulting sample rate to 48000 to calculate the
    // primer offset, needs to be resolved.
    this._primerOffset = 0; // 2048 / 48000;
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
   * Schedules a segment for playback.
   * @param  {!Object} segment
   *         The segment to schedule.
   */
  _startSegment(segment) {
    if (segment && segment.bufferSource) {
      // Adjust the parameters when, offset and duration for the context time.
      const when = segment.when + this._contextSyncTime;
      const offset = segment.offset + this._primerOffset;
      const { duration } = segment;

      // Calculate any lateness in playback.
      const playOffset = this._context.currentTime - when;

      // If the segment is entirely too late for playback, play for a duration
      // of 0 as all segments in the buffer must be played in order to avoid
      // calling stop on a segment that has not yet been played. Currently there
      // is no way to detect if a segment has been played already. If the
      // segment is only slightly late then play as much as possible. Otherwise;
      // play the entire segment.
      if (playOffset < segment.duration) {
        segment.bufferSource.start(
          playOffset > 0 ? 0 : when,
          playOffset > 0 ? offset + playOffset : offset,
          playOffset > 0 ? duration - playOffset : duration,
        );
      } else {
        segment.bufferSource.start(0, 0, 0);
      }
    }
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
    let segment = null;
    let isFound = false;
    let i = 0;

    while (!isFound && i < this._buffer.segments.length) {
      if (this._buffer.segments[i].n === n) {
        segment = this._buffer.segments[i];

        // Use the raw audio data to instantiate a bufferSourceNode, and connect
        // to the streams output.
        segment.bufferSource = this._context.createBufferSource();
        segment.bufferSource.buffer = data;
        segment.bufferSource.connect(this._output);

        // If the stream is currently playing then schedule for playback.
        if (this._isStreaming) {
          this._startSegment(segment);
        }

        isFound = true;
      }
      i += 1;
    }

    return segment;
  }
}
