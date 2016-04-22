import MockAudioSegmentStream from './_mock-audio-segment-stream';
import MockAudioContext from './../../../_mock-audio-context';

import mockAudioRoutines from './_mock-audio-stream-routines';

describe('AudioSegmentStream', function() {
  beforeAll(function () {
    jasmine.Ajax.install();
    jasmine.clock().install();

    this.baseMockRoutine = mockAudioRoutines[0];
    this.mockRoutines = mockAudioRoutines;

    // The primer offset is required because AudioContext.decodeAudioData cannot
    // currently decode audio segments without fully formed headers. This will
    // not be required in a future Web Audio API update.
    // this._primerOffset = 2048 / this._context.sampleRate;
    // HACK - to be resolved defaulting sample rate to 48000 to calculate the
    // primer offset, needs to be resolved.
    this.primerOffset = 2048 / 48000;

    // Helper function to register responses to segment requests.
    this.registerSegmentUrls = (segments) => {
      segments.forEach((segment) => jasmine.Ajax
        .stubRequest(segment.url)
        .andReturn({
          status: 200,
          contentType: 'audio/mpeg',
          response: segment.payload,
        })
      );
    };

    // Helper function to get a segment from an array by sequence number n.
    this.getSegment = (segments, n) => {
      let segment = null;
      let isFound = false;
      let i = 0;

      while (!isFound && i < segments.length) {
        if (segments[i].n === n) {
          segment = segments[i];
          isFound = true;
        }
        i++;
      }

      return segment;
    }
  });

  afterAll(function() {
    jasmine.Ajax.uninstall();
    jasmine.clock().uninstall();
  });

  it('should construct', function() {
    const context = new MockAudioContext();
    const definition = this.baseMockRoutine.definition;
    const audioStream = new MockAudioSegmentStream(context, definition);
  });

  it('should expose read only output node', function() {
    const context = new MockAudioContext();
    const definition = this.baseMockRoutine.definition;
    const audioStream = new MockAudioSegmentStream(context, definition);

    expect(audioStream.output).toEqual(jasmine.any(ChannelSplitterNode));
    expect(() => { audioStream.output = null; }).toThrowError(TypeError);
  });

  it('should expose read only channel count', function() {
    const context = new MockAudioContext();
    const definition = this.baseMockRoutine.definition;
    const audioStream = new MockAudioSegmentStream(context, definition);

    expect(audioStream.channelCount).toEqual(definition.channelCount);
    expect(() => { audioStream.channelCount = null; }).toThrowError(TypeError);
  });

  it('should end naturally and call endedCallback', function (done) {
    const context = new MockAudioContext();
    const definition = this.baseMockRoutine.definition;
    const audioStream = new MockAudioSegmentStream(context, definition);

    const routine = this.baseMockRoutine;
    const { initial, loop, offset, duration } = routine.primeParameters;
    this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

    // Prime and start the stream, mocking context and system time.
    context.currentTime = routine.startParameters.contextStartTime;
    audioStream.prime(initial, loop, offset, duration).then(() => {
      audioStream.start(context.currentTime, () => {
        done();
      });

      context.currentTime += definition.duration;
      jasmine.clock().tick(definition.duration * 1000);
    });
  });

  it('should prime and play the correct segments', function (done) {
    // Create a promise for each test routine available.
    const routinePromises = this.mockRoutines.map((routine) => {
      return new Promise((resolve, reject) => {

        // Construct new objects for each test routine.
        const context = new MockAudioContext();
        const definition = routine.definition;
        const audioStream = new MockAudioSegmentStream(context, definition);

        // Shorthand references for commonly required routine values.
        const { initial, loop, offset, duration } = routine.primeParameters;
        const expectedSegments = routine.expected.segments;
        const contextStartTime = routine.startParameters.contextStartTime;
        this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

        // Construct a callback to test segments being buffered. All segments
        // expected should arrive and with correct playback-region metadata.
        let segmentCount = 0;
        let segmentsToTest = [];
        audioStream.segmentLoadedCallback = (segment) => {
          // Buffer loaded segments as they may arrive out of sequence order.
          segmentsToTest.push(segment);

          // Get the current segment expected segment and the corresponding
          // loaded segment if it exists in the buffer.
          let mockSegment = expectedSegments[segmentCount];
          let testSegment = mockSegment ?
            this.getSegment(segmentsToTest, mockSegment.n) : null;

          // Attempt to advance the expected segment checks as far as possible.
          while(mockSegment && testSegment) {
            // Check that segment playback-region metadata is as expected.
            expect(mockSegment.n).toBe(testSegment.n);
            expect(mockSegment.number).toBe(testSegment.number);
            expect(mockSegment.when).toBe(testSegment.when);
            expect(mockSegment.offset).toBe(testSegment.offset);
            expect(mockSegment.duration).toBe(testSegment.duration);

            // If segment was all correct, increment segment number.
            segmentCount++;
            if(segmentCount < expectedSegments.length) {
              // Advance context and system time to trigger segment load.
              const diffTime = contextStartTime - context.currentTime +
                expectedSegments[segmentCount].when;
              context.currentTime += diffTime;
              jasmine.clock().tick(1000 * (diffTime + 4));
            } else if(segmentCount >= expectedSegments.length) {
              // Stop stream and complete test.
              audioStream.stop();
              resolve();
            }

            mockSegment = expectedSegments[segmentCount];
            testSegment = mockSegment ?
              this.getSegment(segmentsToTest, mockSegment.n) : null;
          }
        }

        context.currentTime = contextStartTime;
        audioStream.prime(initial, loop, offset, duration).then(() => {
          audioStream.start(contextStartTime);
          jasmine.clock().tick(1000 * (context.currentTime - contextStartTime));
        });
      });
    });

    // Run all test routines.
    Promise.all(routinePromises).then(done);
  });

  it('should correctly schedule audio for playback', function (done) {
    const routinePromises = [];
    const delaysToTest = [0, 3, 6];

    this.mockRoutines.forEach((routine) => {
      delaysToTest.forEach((delay) => {
        routinePromises.push(new Promise((resolve, reject) => {
          // Construct new objects for each test routine.
          const context = new MockAudioContext();
          const definition = routine.definition;
          const audioStream = new MockAudioSegmentStream(context, definition);

          // Shorthand references for commonly required routine values.
          const { initial, loop, offset, duration } = routine.primeParameters;
          const contextStartTime = routine.startParameters.contextStartTime;
          this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

          // Construct a callback to test segments being scheduled for playback.
          // All segments should be correctly scheduled relative to delay.
          let segmentCount = 0;
          context.bufferSourceStartCallback = (when, offset, duration) => {
            const mockSegment = routine.expected.segments[segmentCount];

            if (delay >= mockSegment.when + mockSegment.duration) {
              // Too late to playback the segment.
              expect(when).toBe(0);
              expect(offset).toBe(0);
              expect(duration).toBe(0);
            } else if (delay > mockSegment.when) {
              // Too late to playback the entire segment.
              const segmentDelay = delay % definition.segmentDuration;
              expect(when).toBe(0);
              expect(offset).toBe(mockSegment.offset + segmentDelay +
                this.primerOffset);
              expect(duration).toBe(mockSegment.duration - segmentDelay);
            } else {
              // Time to playback the entire segment.
              expect(when).toBe(mockSegment.when + contextStartTime);
              expect(offset).toBe(mockSegment.offset + this.primerOffset);
              expect(duration).toBe(mockSegment.duration);
            }

            segmentCount++;
            if (segmentCount >= routine.expected.numberOfPrimeSegments) {
              // Stop stream and complete test.
              audioStream.stop();
              resolve();
            }
          };

          // Simulate playback with da delay.
          context.currentTime = contextStartTime + delay;
          audioStream.prime(initial, loop, offset, duration).then(() => {
            audioStream.start(contextStartTime);
          });
        }));
      });
    });

    // Run all test routines.
    Promise.all(routinePromises).then(done);
  });
});
