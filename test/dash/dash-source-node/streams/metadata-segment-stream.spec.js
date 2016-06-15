import MetadataSegmentStream from
  './../../../../src/dash/dash-source-node/streams/metadata-segment-stream';

import MockAudioContext from './../../../mock-audio-context';
import mockMetadataRoutines from './metadata-stream-routines';

describe('MetadataSegmentStream', () => {
  beforeAll(function beforeAll() {
    jasmine.Ajax.install();
    jasmine.clock().install();

    this.baseMockRoutine = mockMetadataRoutines[0];
    this.mockRoutines = mockMetadataRoutines;

    // Helper function to register responses to segment requests.
    this.registerSegmentUrls = (segments) => {
      segments.forEach((segment) => jasmine.Ajax
        .stubRequest(segment.url)
        .andReturn({
          status: 200,
          contentType: 'application/json',
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
    };
  });

  afterAll(() => {
    jasmine.Ajax.uninstall();
    jasmine.clock().uninstall();
  });

  it('should construct', function it() {
    const context = MockAudioContext.createAudioContext();
    const definition = this.baseMockRoutine.definition;
    const metadataStream = new MetadataSegmentStream(context, definition);
    expect(metadataStream).toBeDefined();
  });

  it('should accept a metadata callback function', function it() {
    const context = MockAudioContext.createAudioContext();
    const definition = this.baseMockRoutine.definition;
    const metadataStream = new MetadataSegmentStream(context, definition);
    const metadataCallback = () => {};

    // Correctly set and confirm metadata callback.
    metadataStream.metadataCallback = metadataCallback;
    expect(metadataStream.metadataCallback).toBe(metadataCallback);

    // Incorrectly set and confirm error is thrown.
    expect(() => {
      metadataStream.metadataCallback = null;
    }).toThrowError(Error);
    expect(() => {
      metadataStream.metadataCallback = 0;
    }).toThrowError(Error);
  });

  it('should prime and play with default parameters', function it(done) {
    const context = MockAudioContext.createAudioContext();
    const definition = this.baseMockRoutine.definition;
    const metadataStream = new MetadataSegmentStream(context, definition);

    const routine = this.baseMockRoutine;
    const expectedSegments = routine.expected.segments;
    const contextStartTime = routine.startParameters.contextStartTime;
    this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

    // Construct a callback to test segments being buffered. All segments
    // expected should arrive and with correct playback-region metadata.
    let segmentCount = 0;
    const segmentsToTest = [];
    metadataStream.metadataCallback = (segment) => {
      // Buffer loaded segments as they may arrive out of sequence order.
      segmentsToTest.push(segment);

      // Get the current segment expected and the corresponding loaded segment
      // if it exists in the buffer.
      let mockSegment = expectedSegments[segmentCount];
      let testSegment = mockSegment ?
        this.getSegment(segmentsToTest, mockSegment.n) : null;

      // Attempt to advance the expected segment checks as far as possible.
      while (mockSegment && testSegment) {
        // Check that segment playback-region metadata is as expected.
        expect(mockSegment.n).toEqual(testSegment.n);
        expect(mockSegment.number).toEqual(testSegment.number);
        expect(mockSegment.when).toEqual(testSegment.when);
        expect(mockSegment.offset).toEqual(testSegment.offset);
        expect(mockSegment.duration).toEqual(testSegment.duration);
        expect(mockSegment.metadata).toEqual(testSegment.metadata);

        // If segment was all correct, increment segment number.
        segmentCount++;
        if (segmentCount < expectedSegments.length) {
          // Advance context and system time to trigger segment load.
          const diffTime = contextStartTime - context.currentTime +
            expectedSegments[segmentCount].when;
          context.currentTime += diffTime;
          jasmine.clock().tick(1000 * (diffTime + 4));
        } else if (segmentCount >= expectedSegments.length) {
          // Stop stream and complete test.
          metadataStream.stop();
          done();
        }

        mockSegment = expectedSegments[segmentCount];
        testSegment = mockSegment ?
          this.getSegment(segmentsToTest, mockSegment.n) : null;
      }
    };

    // Prime and start the stream, mocking context and system time.
    metadataStream.prime().then(() => {
      // Confirm the correct number of segments have been primed.
      expect(segmentCount).toBe(routine.expected.numberOfPrimeSegments);

      // Start the stream and advance the system time.
      metadataStream.start();
      jasmine.clock().tick(1000 * context.currentTime);
    });
  });

  it('should end naturally and call endedCallback', function it(done) {
    const context = MockAudioContext.createAudioContext();
    const definition = this.baseMockRoutine.definition;
    const metadataStream = new MetadataSegmentStream(context, definition);

    const routine = this.baseMockRoutine;
    const { initial, loop, offset, duration } = routine.primeParameters;
    this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

    // Prime and start the stream, mocking context and system time.
    context.currentTime = routine.startParameters.contextStartTime;
    metadataStream.prime(initial, loop, offset, duration).then(() => {
      metadataStream.start(context.currentTime, () => {
        done();
      });

      context.currentTime += definition.duration;
      jasmine.clock().tick(definition.duration * 1000);
    });
  });

  it('should prime and play the correct segments', function it(done) {
    // Create a promise for each test routine available.
    const routinePromises = this.mockRoutines.map(
      (routine) => new Promise((resolve) => {
        // Construct new objects for each test routine.
        const context = MockAudioContext.createAudioContext();
        const definition = routine.definition;
        const metadataStream = new MetadataSegmentStream(context, definition);

        // Shorthand references for commonly required routine values.
        const { initial, loop, offset, duration } = routine.primeParameters;
        const expectedSegments = routine.expected.segments;
        const contextStartTime = routine.startParameters.contextStartTime;
        this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

        // Construct a callback to test segments being buffered. All segments
        // expected should arrive and with correct playback-region metadata.
        let segmentCount = 0;
        const segmentsToTest = [];
        metadataStream.metadataCallback = (segment) => {
          // Buffer loaded segments as they may arrive out of sequence order.
          segmentsToTest.push(segment);

          // Get the current segment expected segment and the corresponding
          // loaded segment if it exists in the buffer.
          let mockSegment = expectedSegments[segmentCount];
          let testSegment = mockSegment ?
            this.getSegment(segmentsToTest, mockSegment.n) : null;

          // Attempt to advance the expected segment checks as far as possible.
          while (mockSegment && testSegment) {
            // Check that segment playback-region metadata is as expected.
            const segmentsEqual =
              mockSegment.n === testSegment.n &&
              mockSegment.number === testSegment.number &&
              mockSegment.when === testSegment.when &&
              mockSegment.offset === testSegment.offset &&
              mockSegment.duration === testSegment.duration;
            expect(segmentsEqual).toBeTruthy();

            // If segment was all correct, increment segment number.
            segmentCount++;
            if (segmentCount < expectedSegments.length) {
              // Advance context and system time to trigger segment load.
              const diffTime = contextStartTime - context.currentTime +
                expectedSegments[segmentCount].when;
              context.currentTime += diffTime;
              jasmine.clock().tick(1000 * (diffTime + 4));
            } else if (segmentCount >= expectedSegments.length) {
              // Stop stream and complete test.
              metadataStream.stop();
              resolve();
            }

            mockSegment = expectedSegments[segmentCount];
            testSegment = mockSegment ?
              this.getSegment(segmentsToTest, mockSegment.n) : null;
          }
        };

        context.currentTime = contextStartTime;
        metadataStream.prime(initial, loop, offset, duration).then(() => {
          // Confirm the correct number of segments have been primed.
          expect(segmentCount).toBe(routine.expected.numberOfPrimeSegments);

          // Start the stream and advance the context and system time.
          metadataStream.start(contextStartTime);
          jasmine.clock().tick(1000 * (context.currentTime - contextStartTime));
        });
      })
    );

    // Run all test routines.
    Promise.all(routinePromises).then(done);
  });
});
