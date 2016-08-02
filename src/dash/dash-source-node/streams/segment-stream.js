/**
 * A class to manage a single stream of segments, synchronised to an audio
 * context.
 * @ignore
 * @private
 * @abstract
 */
export default class SegmentStream {
  /**
   * Constructs a new {@link SegmentStream}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Loader} loader
   *         The loader that will be used to download segment data.
   * @param  {!Object} definition
   *         An object that defines the stream parameters.
   */
  constructor(context, loader, definition) {
    this._context = context;
    this._contextSyncTime = 0;
    this._loader = loader;
    this._minBufferSize = 3;

    // Clone required information form the provided definition.
    this._stream = {};
    this._stream.id = definition.id;
    this._stream.start = definition.start;
    this._stream.duration = definition.duration;
    this._stream.segmentDuration = definition.segmentDuration;
    this._stream.segmentStart = definition.segmentStart;
    this._stream.segmentEnd = definition.segmentStart - 1 +
      Math.ceil(definition.duration / definition.segmentDuration);
    this._stream.templateUrl = definition.templateUrl;

    // Instantiate a circular buffer for segments .
    this._buffer = {};
    this._buffer.segments = [];
    this._buffer.frontIndex = 0;
    this._buffer.size = Math.max(Math.ceil(definition.bufferTime /
      definition.segmentDuration), this._minBufferSize);

    // Instantiate information describing the playback region.
    this._play = {};
    this._play.initial = 0;
    this._play.offset = 0;
    this._play.duration = 0;
    this._play.loop = false;
    this._play.endedCallback = null;
  }

  /**
   * Primes the stream to play the region defined by the parameters.
   * @param  {?number} [initial=0]
   *         The time into the region playback should start from.
   * @param  {?boolean} [loop=false]
   *         True if playback of the region should loop.
   * @param  {?number} [offset=0]
   *         The time into the performance the region starts.
   * @param  {?number} [duration=definition.duration-offset]
   *         The duration of the region to play.
   * @return {Promise}
   *         A Promise that resolves when the stream is primed.
   */
  prime(initial = 0, loop = false,
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
    const startOffset = this._play.offset - this._stream.start;
    const initialOffset = startOffset + this._play.initial;
    const endOffset = startOffset + this._play.duration;

    this._play.startOverlap = Math.abs(startOffset) %
      this._stream.segmentDuration;
    this._play.initialOverlap = Math.abs(initialOffset) %
      this._stream.segmentDuration;
    this._play.endOverlap = Math.abs(endOffset) %
      this._stream.segmentDuration;

    this._play.startSegment = this._stream.segmentStart +
      Math.floor(startOffset / this._stream.segmentDuration);
    this._play.initialSegment = this._stream.segmentStart +
      Math.floor(initialOffset / this._stream.segmentDuration);
    this._play.endSegment = this._stream.segmentStart - 1 +
      Math.ceil(endOffset / this._stream.segmentDuration);

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

  /**
   * Starts streaming of the region defined by prime.
   * @param  {?number} [contextSyncTime=0]
   *         The context time to which the stream start should be synchronised.
   * @param  {?function()} [endedCallback=null]
   *         A function that is called when stream playback has naturally ended.
   */
  start(contextSyncTime = 0, endedCallback = () => {}) {
    this._contextSyncTime = contextSyncTime;
    this._play.endedCallback = endedCallback;

    this._start();
  }

  /**
   * Stops streaming of the region defined by prime.
   */
  stop() {
    this._stop();
  }

  /**
   * Checks if a new segment can be downloaded. If so; attempts to download it.
   */
  _manageBuffer() {
    // Get the front segment and check to see if it has finished playing.
    const currentSegment = this._buffer.segments[this._buffer.frontIndex];
    const currentSegmentEnd = currentSegment.when + currentSegment.duration;
    const currentTime = this._getCurrentSyncTime();

    if (currentTime >= currentSegmentEnd) {
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

  /**
   * Returns the number of seconds past since the sync point.
   * @return {number}
   *         The number of seconds past since the sync point.
   */
  _getCurrentSyncTime() {
    return this._context.currentTime - this._contextSyncTime;
  }

  /**
   * Returns a template for a segment. The template constitutes the number in
   * the playback sequence, the segment sequence number, tand he period covered
   * by the segment relative to playback start (defined as segment start time,
   * duration and offset.)
   * @param  {!number} n
   *         The nuber of the segment in the layback sequence requested.
   * @return {Object}
   *         The segment template.
   */
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

    // Trim the start of the first segment of the first loop if required.
    // Otherwise; trim the start of the first loop segment if required.
    if (n === 0) {
      when = 0;
      duration = duration - this._play.initialOverlap;
      offset = offset + this._play.initialOverlap;
    } else if (number === this._play.startSegment) {
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

  /**
   * This must be overridden by subclasses. Should add a data payload to a
   * segment in the buffer, performing any pre- or post-processing required.
   * @abstract
   * @example
   * // _addDataToSegment(data, n) {
   * //   let segment = null;
   * //   let isFound = false;
   * //   let i = 0;
   * //
   * //   while (!isFound && i < this._buffer.segments.length) {
   * //     if (this._buffer.segments[i].n === n) {
   * //       segment = this._buffer.segments[i];
   * //       segment.data = data;
   * //       isFound = true;
   * //     }
   * //     i++;
   * //   }
   * //
   * //   return segment;
   * // }
   * @param  {!any} data
   *         The data to add to the segment.
   * @param  {!number} n
   *         The number of the segment in the playback sequence.
   * @return {Object}
   *         The complete segment.
   */
  _addDataToSegment() { }

  /**
   * Starts streaming of the region defined by prime. This may be overridden by
   * subclasses needing to act before streaming is started.
   */
  _start() {
    // Continually maintain the buffer. Checks if a new segment can be
    // downloaded with a frequency relative to the streams segment duration.
    this.manageBufferInterval = setInterval(
      () => this._manageBuffer(),
      this._stream.segmentDuration / 4 * 1000
    );
  }

  /**
   * Stops streaming of the region defined by prime. This may be overridden by
   * subclasses needing to act before streaming is stopped.
   */
  _stop() {
    // Stop maintaining the buffer.
    clearInterval(this.manageBufferInterval);
  }

  /**
   * Ends streaming of the region defined by prime. This may be
   * overridden by subclasses needing to act when streaming ends naturally.
   */
  _end() {
    this._stop();
    this._play.endedCallback();
  }
}
