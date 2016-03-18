import {
  EventTarget,
} from '../../core/_index';

export default class DashSegmentStream extends EventTarget {
  constructor(context, loader, definition) {
    super();

    // Buffer the audio context and loader.
    this.context = context;
    this.loader = loader;

    // Buffer the required stream descriptors from the definition.
    this.id = definition.id;
    this.streamStart = definition.start;
    this.streamDuration = definition.duration;
    // this.streamEnd = this.streamStart + this.streamDuration;
    this.segmentStart = definition.segmentStart;
    this.segmentDuration = definition.segmentDuration;
    this.segmentEnd = this.segmentStart +
      Math.floor(this.streamDuration / this.segmentDuration) - 1;
    this.channelCount = definition.channelCount;
    this.templateUrl = definition.templateUrl;

    // Create a buffer to store segments awaiting playback.
    this.bufferSize = Math.ceil(definition.bufferTime / this.segmentDuration);
    this.buffer = [];
  }

  prime(playbackTime = 0) {
    this.playbackTime = playbackTime;

    // Prime the buffer with segments ready to start playing from playbackTime
    // seconds into the presentation duration.
    const promises = [];
    for (let i = 0; i < this.bufferSize; i++) {
      const time = this.playbackTime + (this.segmentDuration * i);
      const number = this.getSegmentNumberForTime(time);
      const url = this.getURLForSegmentNumber(number);

      // Keep track of the segments the buffer currently represents.
      if (i === 0) {
        this.bufferFront = number;
        this.bufferFrontIndex = 0;
      }

      // Only load segments that lay within the streams segment bounds.
      if (number >= this.segmentStart && number <= this.segmentEnd) {
        promises.push(this.loader.load(url).then((data) => {
          this.addToBuffer(number, data, true);
        }));
      }
    }

    return Promise.all(promises);
  }

  start(contextTime) {
    // Start playback from the playbackTime used to prime the stream and
    // synchronise that playbackTime with the contextTime passed.
    this.contextTime = contextTime;
    this.manageBufferInterval = setInterval(
      () => this.manageBuffer(),
      Math.floor(this.segmentDuration / 2)
    );
  }

  stop() {
    clearInterval(this.manageBufferInterval);
  }

  manageBuffer() {
    // Calculate the segment that should be playing for the current context
    // time; if it differs from the last buffered segment, download it.
    const currentBufferTime = this.playbackTime +
      ((this.bufferSize - 1) * this.segmentDuration) +
      this.context.currentTime - this.contextTime;
    const currSegment = this.getSegmentNumberForTime(currentBufferTime);
    const lastSegment = this.bufferFront + this.bufferSize - 1;

    if (currSegment !== lastSegment) {
      this.advanceBuffer();

      if (currSegment >= this.segmentStart && currSegment <= this.segmentEnd) {
        const url = this.getURLForSegmentNumber(currSegment);
        this.loader.load(url).then((data) =>
          this.addToBuffer(currSegment, data, false)
        );
      }
    }
  }

  addToBuffer(number, segment) {
    // A negative position indicates a segment that has arrived too late for
    // playback. A position greater that the buffer size indicates a segment
    // that has arrived too early to fit in the buffer. Late packets may occur
    // due to high latency whilst early packets should not occur naturally.
    let position = number - this.bufferFront;
    if (position >= 0 && position < this.bufferSize) {
      // Correct the position for logically circular array and add to buffer.
      position = (this.bufferFrontIndex + position) % this.bufferSize;
      this.buffer[position] = segment;
      this.dispatchBufferedSegment(segment);
    }
  }

  advanceBuffer() {
    // Advances the buffer, incrementing the range of segments that can be
    // accepted into the buffer by one.
    this.buffer[this.bufferFrontIndex] = null;
    this.bufferFront++;
    this.bufferFrontIndex++;
    this.bufferFrontIndex = this.bufferFrontIndex % this.bufferSize;
  }

  getSegmentNumberForTime(time) {
    const streamTime = time - this.streamStart;
    return Math.floor(streamTime / this.segmentDuration) + this.segmentStart;
  }

  getURLForSegmentNumber(number) {
    return this.templateUrl.replace('$Number', number);
  }

  dispatchBufferedSegment(segment) {
    this.dispatchEvent({
      type: 'bufferedsegment',
      src: this,
      segment,
    });
  }
}
