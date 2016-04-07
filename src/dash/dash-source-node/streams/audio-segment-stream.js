import { AudioLoader } from '../../../core/_index';
import SegmentStream from './segment-stream';

export default class AudioSegmentStream extends SegmentStream {
  constructor(context, definition) {
    super(context, new AudioLoader(context), definition);

    // The primer offset is required because AudioContext.decodeAudioData cannot
    // currently decode audio segments without fully formed headers. This will
    // not be required in a future Web Audio API update.
    this._primerOffset = 2048 / this._context.sampleRate;
    this._isStreaming = false;
    this._output = this._context.createChannelSplitter(this.channelCount);
  }

  get output() {
    return this._output;
  }

  _start() {
    // Set as streaming and schedule all audio in the buffer.
    this._isStreaming = true;
    this._buffer.segments.forEach((segment) => {
      this._startSegment(segment);
    });

    super._start();
  }

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

  _startSegment(segment) {
    if (segment && segment.bufferSource) {
      // Adjust the parameters when, offset and duration for the context time.
      const when = segment.when + this._contextSyncTime;
      const offset = segment.offset + this._primerOffset;
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
        segment.bufferSource.start(
          playOffset > 0 ? 0 : when,
          playOffset > 0 ? offset + playOffset : offset,
          playOffset > 0 ? duration - playOffset : duration
        );
      } else {
        segment.bufferSource.start(0, 0, 0);
      }
    }
  }

  _addDataToSegment(data, n) {
    for (let i = 0; i < this._buffer.segments.length; i++) {
      const segment = this._buffer.segments[i];

      if (segment.n === n) {
        // Use the raw audio data to instantiate a bufferSourceNode, and connect
        // to the streams output.
        segment.bufferSource = this._context.createBufferSource();
        segment.bufferSource.buffer = data;
        segment.bufferSource.connect(this._output);

        // If the stream is currently playing then schedule for playback.
        if (this._isStreaming) {
          this._startSegment(segment);
        }
      }
    }
  }
}
