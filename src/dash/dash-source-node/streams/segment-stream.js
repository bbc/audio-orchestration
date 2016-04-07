export default class SegmentStream {
  constructor(context, loader, definition) {
    this._context = context;
    this._contextSyncTime = 0;
    this._loader = loader;

    // Clone required information form the provided definition.
    this._stream = {};
    this._stream.id = definition.id;
    this._stream.start = definition.start;
    this._stream.duration = definition.duration;
    this._stream.segmentDuration = definition.segmentDuration;
    this._stream.segmentStart = definition.segmentStart;
    this._stream.segmentEnd = definition.segmentStart - 1 +
      Math.ceil(definition.duration / definition.segmentDuration);
    this._stream.channelCount = definition.channelCount;
    this._stream.templateUrl = definition.templateUrl;

    // Instantiate a circular buffer for segments .
    this._buffer = {};
    this._buffer.segments = [];
    this._buffer.frontIndex = 0;
    this._buffer.size = Math.ceil(definition.bufferTime /
      definition.segmentDuration);

    // Instantiate information describing the playback region.
    this._play = {};
    this._play.initial = 0;
    this._play.offset = 0;
    this._play.duration = 0;
    this._play.loop = false;
    this._play.endedCallback = null;
  }

  prime(initial = 0, loop = true,
    offset = 0, duration = this._stream.duration - offset) {
    // Store information describing the playback region.
    this._play.initial = initial;
    this._play.loop = loop;
    this._play.offset = offset;
    this._play.duration = duration;

    // Clear the buffer to an initial empty state.
    this._buffer.segments = [];
    this._buffer.frontIndex = 0;

    // Precalculate useful segment numbers and overlap so that there is no need
    // to repeat calculations in the worker threads that maintain the buffer.
    this._play.startOverlap = (this._stream.segmentDuration -
      ((this._stream.start - this._play.offset) %
      this._stream.segmentDuration)) % this._stream.segmentDuration;
    this._play.endOverlap = (this._stream.segmentDuration -
      ((this._play.startOverlap + this._play.duration) %
      this._stream.segmentDuration)) % this._stream.segmentDuration;
    this._play.initialOverlap = (this._play.initial %
        this._stream.segmentDuration) % this._stream.segmentDuration;

    this._play.startSegment = this._stream.segmentStart +
      Math.floor((this._play.offset - this._stream.start) /
      this._stream.segmentDuration);
    this._play.endSegment = this._play.startSegment - 1 +
      Math.ceil((this._play.startOverlap + this._play.duration) /
      this._stream.segmentDuration);
    this._play.initialSegment = this._stream.segmentStart +
      Math.floor((this._play.offset + this._play.initial - this._stream.start) /
      this._stream.segmentDuration);

    this._play.segmentsPerLoop = 1 + this._play.endSegment -
      this._play.startSegment;

    // Initially fill the buffer with segments.
    const promises = [];
    for (let i = 0; i < this._buffer.size; i++) {
      const segment = this._getTemplateForNthSegment(i);
      this._buffer.segments.push(segment);

      // Only load segments that lay within the streams segment bounds.
      if (segment.number >= this._stream.segmentStart &&
        segment.number <= this._stream.segmentEnd) {
        promises.push(this._loader.load(segment.url).then((data) => {
          this._addDataToSegment(data, segment.n);
        }));
      }
    }

    return Promise.all(promises);
  }

  start(contextSyncTime = 0, endedCallback) {
    this._contextSyncTime = contextSyncTime;
    this._play.endedCallback = endedCallback;

    this._start();
  }

  stop() {
    this._stop();
  }

  get channelCount() {
    return this._stream.channelCount;
  }

  _manageBuffer() {
    // Get the front segment and check to see if it has finished playing.
    const currentSegment = this._buffer.segments[this._buffer.frontIndex];
    const currentSegmentEnd = currentSegment.when + currentSegment.duration;
    const currentTime = this._getCurrentSyncTime();

    if (currentTime > currentSegmentEnd) {
      if (!this._play.loop && currentSegment.number >= this._play.endSegment) {
        // Playback has naturally ended.
        this._end();
      } else {
        // Playback must continue. Build the next required segment, add to
        // the buffer, and advance the buffer front.
        const newSegmentNumber = currentSegment.n + this._buffer.size;
        const newSegment = this._getTemplateForNthSegment(newSegmentNumber);

        this._buffer.segments[this._buffer.frontIndex] = newSegment;
        this._buffer.frontIndex++;
        this._buffer.frontIndex = this._buffer.frontIndex % this._buffer.size;

        if (newSegment.number >= this._stream.segmentStart &&
          newSegment.number <= this._stream.segmentEnd) {
          this._loader.load(newSegment.url).then((data) => {
            this._addDataToSegment(data, newSegment.n);
          });
        }
      }
    }
  }

  _getCurrentSyncTime() {
    return this._context.currentTime - this._contextSyncTime;
  }

  _getTemplateForNthSegment(n) {
    // Calculate the loop position and number of the nth segment.
    const nOffset = n + this._play.initialSegment - this._play.startSegment;
    const loopNumber = this._play.loop ?
      Math.floor(nOffset / this._play.segmentsPerLoop) : 0;
    const loopPosition = this._play.loop ?
      nOffset % this._play.segmentsPerLoop : nOffset;

    // Calulate the stream segment number and url.
    const number = this._play.startSegment + loopPosition;
    const url = this._stream.templateUrl.replace('$Number', number);

    // Construct the default parameters for when, offset and duration that
    // describe the period covered by the segment (w.r.t. context time:)
    // when - when the play should start.
    // offset - where the playback should start.
    // duration - the intended length of the portion to be played.
    let when = - this._play.startOverlap - this._play.initial +
      loopNumber * this._play.duration +
      loopPosition * this._stream.segmentDuration;
    let offset = 0;
    let duration = this._stream.segmentDuration;

    // Trim the start of the first segment of the first loop.
    if (n === 0) {
      when = when + this._play.initialOverlap;
      duration = duration - this._play.initialOverlap;
      offset = offset + this._play.initialOverlap;
    }

    // Trim the start of the first loop segment if required.
    if (number === this._play.startSegment) {
      when = when + this._play.startOverlap;
      duration = duration - this._play.startOverlap;
      offset = offset + this._play.startOverlap;
    }

    // Trim the end of the last loop segment if required.
    if (number === this._play.endSegment) {
      duration = duration - this._play.endOverlap;
    }

    // Return the template for the segment.
    return { n, number, url, when, offset, duration };
  }

  _addDataToSegment(data, n) {
    for (let i = 0; i < this._buffer.segments.length; i++) {
      const segment = this._buffer.segments[i];

      if (segment.n === n) {
        segment.data = data;
      }
    }
  }

  _start() {
    // Continually maintain the buffer. Checks if a new segment can be
    // downloaded with a frequency relative to the streams segment duration.
    this.manageBufferInterval = setInterval(
      () => this._manageBuffer(),
      this._stream.segmentDuration / 4 * 1000
    );
  }

  _stop() {
    // Stop maintaining the buffer.
    clearInterval(this.manageBufferInterval);
  }

  _end() {
    this._stop();
    if (this._play.endedCallback) {
      this._play.endedCallback();
    }
  }
}
