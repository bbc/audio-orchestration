import DashSourceNode from './../../../src/dash/dash-source-node/dash-source-node';
import MockAudioContext from './../../mock-audio-context';
import mockDashRoutines from './dash-source-node-routines';

describe('DashSourceNode', () => {
  beforeAll(function beforeAll() {
    jasmine.Ajax.install();
    jasmine.clock().install();

    this.baseRoutine = mockDashRoutines[0];
    this.loopRoutine = mockDashRoutines[1];
    this.mockRoutines = mockDashRoutines;

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

    // The primer offset is required because AudioContext.decodeAudioData cannot
    // currently decode audio segments without fully formed headers. This will
    // not be required in a future Web Audio API update.
    // this._primerOffset = 2048 / this._context.sampleRate;
    // HACK - to be resolved defaulting sample rate to 48000 to calculate the
    // primer offset, needs to be resolved.
    this._primerOffset = 2048 / 48000;
  });

  afterAll(() => {
    jasmine.Ajax.uninstall();
    jasmine.clock().uninstall();
  });

  it('should construct with correct number of inputs/outputs', function it() {
    this.mockRoutines.forEach((routine) => {
      const context = new MockAudioContext();
      const dashSourceNode = new DashSourceNode(context, routine.manifest);

      expect(dashSourceNode.numberOfOutputs).toBe(
        routine.expected.channelCount);
    });
  });

  it('should expose read only presentationDuration', function it() {
    const context = new MockAudioContext();
    const manifest = this.baseRoutine.manifest;
    const dashSourceNode = new DashSourceNode(context, manifest);

    expect(dashSourceNode.presentationDuration).toBe(
      manifest.mediaPresentationDuration);
    expect(() => {
      dashSourceNode.presentationDuration = null;
    }).toThrowError(TypeError);
  });

  it('should expose read only state', function it() {
    const context = new MockAudioContext();
    const manifest = this.baseRoutine.manifest;
    const dashSourceNode = new DashSourceNode(context, manifest);

    expect(dashSourceNode.state).toBe('ready');
    expect(() => { dashSourceNode.state = null; }).toThrowError(TypeError);
  });

  it('should expose read only and up-to-date playbackTime', function it(done) {
    const context = new MockAudioContext();
    const routine = this.loopRoutine;
    const manifest = routine.manifest;
    const dashSourceNode = new DashSourceNode(context, manifest);

    expect(dashSourceNode.playbackTime).toBe(0);
    expect(() => {
      dashSourceNode.playbackTime = null;
    }).toThrowError(TypeError);

    this.registerSegmentUrls(routine.segmentsUrlPayloadMap);
    const { initial, loop, offset, duration } = routine.primeParameters;

    const statechangeCallback = (event) => {
      if (event.state === 'playing') {
        // Test initial time.
        expect(dashSourceNode.playbackTime).toBe(
          offset + initial);

        // Test after small increment.
        context.currentTime += 3;
        expect(dashSourceNode.playbackTime).toBe(
          offset + (initial + 3) % duration);

        // Test time follows loop.
        context.currentTime += 10;
        expect(dashSourceNode.playbackTime).toBe(
          offset + (initial + 3 + 10) % duration);

        dashSourceNode.stop();
        done();
      }
    };

    dashSourceNode.addEventListener('statechange', statechangeCallback);
    dashSourceNode.start(initial, loop, offset, duration);
  });

  it('should emit statechange events', function it(done) {
    const context = new MockAudioContext();
    const routine = this.baseRoutine;
    const dashSourceNode = new DashSourceNode(context, routine.manifest);
    this.registerSegmentUrls(this.baseRoutine.segmentsUrlPayloadMap);

    // Ensure that states are emitted and in the corrct order.
    let statechangeCount = 0;
    const statechanges = ['priming', 'playing', 'ready'];
    const statechangeCallback = (event) => {
      expect(event.state).toBe(statechanges[statechangeCount]);
      statechangeCount++;

      if (event.state === 'playing') {
        dashSourceNode.stop();
      } else if (event.state === 'ready') {
        done();
      }
    };

    const { initial, loop, offset, duration } = routine.primeParameters;
    dashSourceNode.addEventListener('statechange', statechangeCallback);
    dashSourceNode.start(initial, loop, offset, duration);
  });

  it('should emit ended event', function it(done) {
    const context = new MockAudioContext();
    const routine = this.baseRoutine;
    const dashSourceNode = new DashSourceNode(context, routine.manifest);
    this.registerSegmentUrls(this.baseRoutine.segmentsUrlPayloadMap);

    const statechangeCallback = (event) => {
      if (event.state === 'playing') {
        context.currentTime += routine.manifest.mediaPresentationDuration;
        jasmine.clock().tick(routine.manifest.mediaPresentationDuration * 1000);
      }
    };

    const endedCallback = () => {
      dashSourceNode.stop();
      done();
    };

    const { initial, loop, offset, duration } = routine.primeParameters;
    dashSourceNode.addEventListener('statechange', statechangeCallback);
    dashSourceNode.addEventListener('ended', endedCallback);
    dashSourceNode.start(initial, loop, offset, duration);
  });

  it('should emit metadata events', function it(done) {
    const routine = this.loopRoutine;
    const expectedSegments = routine.expected.segments;
    const { initial, loop, offset, duration, start } = routine.primeParameters;
    this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

    const context = new MockAudioContext();
    const dashSourceNode = new DashSourceNode(context, routine.manifest);

    let segmentCount = 0;
    const segmentsToTest = [];
    const metadataCallback = (segment) => {
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
        expect(mockSegment.n).toBe(testSegment.n);
        expect(mockSegment.when).toBe(testSegment.when);
        expect(mockSegment.offset).toBe(testSegment.offset);
        expect(mockSegment.duration).toBe(testSegment.duration);
        expect(mockSegment.metadata).toBe(testSegment.metadata);

        // If segment was all correct, increment segment number.
        segmentCount++;
        if (segmentCount >= expectedSegments.length) {
          // Stop stream and complete test.
          dashSourceNode.stop();
          done();
        }

        mockSegment = expectedSegments[segmentCount];
        testSegment = mockSegment ?
          this.getSegment(segmentsToTest, mockSegment.n) : null;
      }
    };

    const statechangeCallback = (event) => {
      if (event.state === 'playing') {
        context.currentTime += start;
        jasmine.clock().tick(start * 1000);
      }
    };

    dashSourceNode.addEventListener('metadata', metadataCallback);
    dashSourceNode.addEventListener('statechange', statechangeCallback);
    dashSourceNode.start(initial, loop, offset, duration);
  });

  it('should schedule audio correctly', function it(done) {
    const routine = this.loopRoutine;
    const expectedStartParams = routine.expected.segments;
    const expectedNumberOfSegments = routine.expected.audioStreams *
      routine.expected.segments.length;
    this.registerSegmentUrls(routine.segmentsUrlPayloadMap);

    const context = new MockAudioContext();
    const dashSourceNode = new DashSourceNode(context, routine.manifest);

    let segmentCount = 0;
    context.bufferSourceStartCallback = () => {
      segmentCount++;
      if (segmentCount >= expectedNumberOfSegments) {
        // Check that the correct number of segments have been scheduled.
        expect(context.bufferSourceStartCallback)
          .toHaveBeenCalledTimes(expectedNumberOfSegments);

        // Check that audio was scheduled for playback as expected.
        for (let i = 0; i < expectedStartParams.length; i++) {
          const { when, offset, duration } = expectedStartParams[i];
          expect(context.bufferSourceStartCallback)
            .toHaveBeenCalledWith(when, offset + this._primerOffset, duration);
        }

        dashSourceNode.stop();
        done();
      }
    };

    const statechangeCallback = (event) => {
      if (event.state === 'playing') {
        context.currentTime += routine.primeParameters.start;
        jasmine.clock().tick(routine.primeParameters.start * 1000);
      }
    };

    spyOn(context, 'bufferSourceStartCallback').and.callThrough();
    const { initial, loop, offset, duration } = routine.primeParameters;
    dashSourceNode.addEventListener('statechange', statechangeCallback);
    dashSourceNode.start(initial, loop, offset, duration);
  });

  it('should allow start/stop to be called out-of-order', function it(done) {
    const context = new MockAudioContext();
    const manifest = this.baseRoutine.manifest;
    const dashSourceNode = new DashSourceNode(context, manifest);
    this.registerSegmentUrls(this.baseRoutine.segmentsUrlPayloadMap);

    // Should not throw error.
    dashSourceNode.stop();

    const statechangeCallback = (event) => {
      if (event.state === 'playing') {
        // Should not throw error.
        dashSourceNode.start();
        dashSourceNode.stop();
        done();
      }
    };

    dashSourceNode.addEventListener('statechange', statechangeCallback);
    dashSourceNode.start();
  });

  it('should correctly validate start initial parameter', function it() {
    const context = new MockAudioContext();
    const manifest = this.baseRoutine.manifest;
    const dashSourceNode = new DashSourceNode(context, manifest);
    const { loop, offset, duration } = this.baseRoutine.primeParameters;

    // Test the initial parameter.
    expect(() => { dashSourceNode.start(- 1); }).toThrowError(Error);
    expect(() => {
      dashSourceNode.start(duration, loop, offset, duration);
    }).toThrowError(Error);
  });

  it('should correctly validate start loop parameter', function it() {
    const context = new MockAudioContext();
    const routine = this.baseRoutine;
    const dashSourceNode = new DashSourceNode(context, routine.manifest);
    const initial = routine.primeParameters.initial;

    // Test the loop parameter.
    expect(() => { dashSourceNode.start(initial, 'str'); }).toThrowError(Error);
    expect(() => { dashSourceNode.start(initial, 0); }).toThrowError(Error);
  });

  it('should correctly validate start offset parameter', function it() {
    const context = new MockAudioContext();
    const manifest = this.baseRoutine.manifest;
    const dashSourceNode = new DashSourceNode(context, manifest);
    const { initial, loop } = this.baseRoutine.primeParameters;

    // Test the offset parameter.
    expect(() => { dashSourceNode.start(0, loop, -1); }).toThrowError(Error);
    expect(() => {
      dashSourceNode.start(initial, loop, manifest.mediaPresentationDuration);
    }).toThrowError(Error);
  });

  it('should correctly validate start duration parameter', function it() {
    const context = new MockAudioContext();
    const manifest = this.baseRoutine.manifest;
    const dashSourceNode = new DashSourceNode(context, manifest);
    const { initial, loop, offset } = this.baseRoutine.primeParameters;

    // Test the duration parameter.
    expect(() => {
      dashSourceNode.start(initial, loop, offset, 0);
    }).toThrowError(Error);
    expect(() => {
      dashSourceNode.start(initial, loop, offset,
        manifest.mediaPresentationDuration + 1);
    }).toThrowError(Error);
  });
});
