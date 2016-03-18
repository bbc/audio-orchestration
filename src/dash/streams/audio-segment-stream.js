import {
  AudioLoader,
} from '../_index';
import SegmentStream from './segment-stream';

export default class AudioSegmentLoader extends SegmentStream {
  constructor(context, definition) {
    super(context, new AudioLoader(context), definition);
    this.output = this.context.createChannelSplitter(this.channelCount);
    // The primer offset is required because AudioContext.decodeAudioData cannot
    // currently decode audio segments without fully formed headers. This will
    // not be required in a future Web Audio API update.
    this.primerOffset = 2048 / this.context.sampleRate;
  }

  start(contextTime) {
    super.start(contextTime);

    // Schedule each audio segment in the buffer to be played.
    for (let i = 0; i < this.bufferSize; i++) {
      if (this.buffer[i]) {
        this.startSegment(this.buffer[i]);
      }
    }
  }

  startSegment(segment) {
    // Calculate the intended context start time for the segment and offset from
    // the current context time. If the offset is positive the segment is late
    // and so only a portion of the segment should be played. The portion should
    // be scheduled to start immediately.
    const start = this.contextTime + segment.startTime - this.playbackTime;
    const offset = this.context.currentTime - start;

    // Only play segment if it is not too late.
    if (offset < this.segmentDuration) {
      segment.bufferSource.start(
        offset > 0 ? 0 : start,
        offset > 0 ? this.primerOffset + offset : this.primerOffset,
        offset > 0 ? this.segmentDuration - offset : this.segmentDuration
      );
    }
  }

  stop() {
    super.stop();

    // Stop all audio sources and empty the audio buffer.
    for (let i = 0; i < this.bufferSize; i++) {
      if (this.buffer[i]) {
        this.buffer[i].bufferSource.stop();
        this.buffer[i] = null;
      }
    }
  }

  addToBuffer(number, audioBuffer, isPriming) {
    // Rather than adding the raw audio to the buffer, use to instantiate a
    // bufferSourceNode and precalculate the desired start time for the segment
    // and instead store these in the buffer.
    const bufferSource = this.context.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(this.output);

    const startTime = this.streamStart +
      (number - this.segmentStart) * this.segmentDuration;

    const segment = {
      bufferSource,
      startTime,
    };

    // If the stream is not priming then schedule the segment for playback
    // before continuing to add to the segment buffer.
    if (!isPriming) {
      this.startSegment(segment);
    }

    super.addToBuffer(number, segment);
  }
}
