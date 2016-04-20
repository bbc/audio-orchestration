import MetadataSegmentStream from './../../../../src/dash/dash-source-node/streams/metadata-segment-stream';

import MockAudioContext from './../../../_mock-audio-context';
import mockMetadataRoutines from './_mock-metadata-stream-routines';

describe('MetadataSegmentStream', function() {
  beforeAll(function () {
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

    // Helper function to compare a segment with a mockSegment.
    this.segmentEquals = (segment, mockSegment) => {
      return segment && mockSegment &&
        segment.n === mockSegment.n &&
        segment.number === mockSegment.number &&
        segment.when === mockSegment.when &&
        segment.offset === mockSegment.offset &&
        segment.duration === mockSegment.duration &&
        segment.metadata === mockSegment.metadata;
    }
  });

  afterAll(function() {
    jasmine.Ajax.uninstall();
    jasmine.clock().uninstall();
  });

  it('should construct', function() {
    const context = new MockAudioContext();
    const definition = this.baseMockRoutine.definition;
    const metadataStream = new MetadataSegmentStream(context, definition);
  });

  it('should accept a metadata callback function', function() {
    const context = new MockAudioContext();
    const definition = this.baseMockRoutine.definition;
    const metadataStream = new MetadataSegmentStream(context, definition);
    const metadataCallback = () => {};

    // Correctly set and confirm metadata callback.
    metadataStream.metadataCallback = metadataCallback;
    expect(metadataStream.metadataCallback).toBe(metadataCallback);

    // Incorrectly set and confirm error is thrown.
    expect(() => metadataStream.metadataCallback = null).toThrowError(Error);
    expect(() => metadataStream.metadataCallback = 0).toThrowError(Error);
  });

  it('should prime and play with default parameters', function (done) {
    const context = new MockAudioContext();
    const definition = this.baseMockRoutine.definition;
    const metadataStream = new MetadataSegmentStream(context, definition);

    const routine = this.baseMockRoutine;
    const expectedSegments = routine.expected.segments;
    this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

    // Setup callback on the MetadataSegmentStream.
    let segmentCount = 0;
    metadataStream.metadataCallback = (segment) => {
      // While we still have mock segments ensure that the mock segments
      // arrive in the correct order with the correct periods specified in
      // the test routine. Otherwise; stop the stream and test routine.
      const mockSegment = expectedSegments[segmentCount++];
      if (mockSegment && segmentCount < expectedSegments.length) {
        const isCorrectSegment = this.segmentEquals(segment, mockSegment);
        expect(isCorrectSegment).toBeTruthy();

        // Advance the context and system time to the point that would
        // trigger another segment to be buffered.
        const timeDiff = context.currentTime +
          expectedSegments[segmentCount].when;
        context.currentTime += timeDiff;
        jasmine.clock().tick(1000 * timeDiff);
      } else {
        metadataStream.stop();
        done();
      }
    };

    // Prime and start the stream, mocking context and system time.
    metadataStream.prime().then(() => {
      // Confirm the correct number of segments have been primed.
      expect(segmentCount).toBe(routine.expected.numberOfPrimeSegments);

      // Start the stream and advance the context and system time.
      metadataStream.start();
      jasmine.clock().tick(1000 * context.currentTime);
    });
  });

  it('should end naturally and call endedCallback', function (done) {
    const context = new MockAudioContext();
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

  it('should prime and play the correct segments', function(done) {
    const routinePromises = [];

    // Test for each routine available.
    this.mockRoutines.forEach((routine) => {
      const context = new MockAudioContext();
      const definition = routine.definition;
      const metadataStream = new MetadataSegmentStream(context, definition);

      const { initial, loop, offset, duration } = routine.primeParameters;
      const expectedSegments = routine.expected.segments;
      const contextStartTime = routine.startParameters.contextStartTime;
      this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

      routinePromises.push(new Promise((resolve, reject) => {
        // Setup callback on the MetadataSegmentStream.
        let segmentCount = 0;
        metadataStream.metadataCallback = (segment) => {
          // While we still have mock segments ensure that the mock segments
          // arrive in the correct order with the correct periods specified in
          // the test routine. Otherwise; stop the stream and test routine.
          const mockSegment = expectedSegments[segmentCount++];
          if (mockSegment && segmentCount < expectedSegments.length) {
            const isCorrectSegment = this.segmentEquals(segment, mockSegment);
            expect(isCorrectSegment).toBeTruthy();

            // Advance the context and system time to the point that would
            // trigger another segment to be buffered.
            const timeDiff = contextStartTime - context.currentTime +
              expectedSegments[segmentCount].when;
            context.currentTime += timeDiff;
            jasmine.clock().tick(1000 * timeDiff);
          } else {
            metadataStream.stop();
            resolve();
          }
        };

        // Prime and start the stream, mocking context and system time.
        context.currentTime = contextStartTime;
        metadataStream.prime(initial, loop, offset, duration).then(() => {
          // Confirm the correct number of segments have been primed.
          expect(segmentCount).toBe(routine.expected.numberOfPrimeSegments);

          // Start the stream and advance the context and system time.
          metadataStream.start(contextStartTime);
          jasmine.clock().tick(1000 * (context.currentTime - contextStartTime));
        });
      }));
    });

    Promise.all(routinePromises).then(done);
  });
});
