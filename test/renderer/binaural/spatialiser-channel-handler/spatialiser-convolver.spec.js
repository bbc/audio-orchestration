import SpatialiserConvolver from
  './../../../../src/renderer/binaural/spatialiser-channel-handler/spatialiser-convolver';
import MockAudioContext from './../../../mock-audio-context';

describe('SpatialiserConvolver', () => {
  it('should correctly construct', () => {
    const context = MockAudioContext.createAudioContext();
    const spatialiserConvolver = new SpatialiserConvolver(context);

    expect(spatialiserConvolver).toBeDefined();
  });

  it('should expose read-only input', () => {
    const context = MockAudioContext.createAudioContext();
    const spatialiserConvolver = new SpatialiserConvolver(context);

    expect(spatialiserConvolver.input).toBeDefined();
    expect(() => { spatialiserConvolver.input = null; }).toThrowError(TypeError);
  });

  it('should expose read-only gain', () => {
    const context = MockAudioContext.createAudioContext();
    const spatialiserConvolver = new SpatialiserConvolver(context);

    expect(spatialiserConvolver.gain).toBeDefined();
    expect(() => { spatialiserConvolver.gain = null; }).toThrowError(TypeError);
  });

  it('should expose delays', () => {
    const context = MockAudioContext.createAudioContext();
    const spatialiserConvolver = new SpatialiserConvolver(context, true);

    spatialiserConvolver.delays = [0.5, 0.2];
    expect(spatialiserConvolver.delays).toEqual([0.5, 0.2]);

    spatialiserConvolver.delays = [0.7, 0.3];
    expect(spatialiserConvolver.delays).toEqual([0.7, 0.3]);
  });

  it('should apply convolution correctly', (done) => {
    const context = MockAudioContext.createAudioContext(2, 0.1, 10000);

    // Create a buffer with identifiable characteristics for the convolver.
    const convFrames = 1000;
    const convBuffer = context.createBuffer(2, convFrames, 10000);
    const convBufferChannelL = convBuffer.getChannelData(0);
    const convBufferChannelR = convBuffer.getChannelData(1);
    // Add a pattern of 1, 0, 1, 0... to the buffer.
    for (let i = 11; i <= 20; i++) {
      convBufferChannelL[i] = (i % 2) * 2 - 1;
    }
    // Add a series of 1s to the buffer.
    for (let i = 25; i < 35; i++) {
      convBufferChannelR[i] = 1;
    }

    const spatialiserConvolver = new SpatialiserConvolver(context, false);
    spatialiserConvolver.buffer = convBuffer;
    spatialiserConvolver.connect(context.destination);

    // Create an always on input buffer.
    const inputFrames = 1000;
    const inputBuffer = context.createBuffer(1, inputFrames, 10000);
    const inputBufferChannel = inputBuffer.getChannelData(0);
    for (let i = 0; i < inputFrames; i++) {
      inputBufferChannel[i] = 1;
    }

    const bufferSource = context.createBufferSource();
    bufferSource.buffer = inputBuffer;
    bufferSource.connect(spatialiserConvolver.input);
    bufferSource.start();

    context.oncomplete = (e) => {
      // Check that the input buffer has been convoluted correctly.
      let isConvolvedCorrectly = true;

      // Check each channel of output against convolution channel.
      const numberOfChannels = Math.min(convBuffer.numberOfChannels,
        e.renderedBuffer.numberOfChannels);
      for (let i = 0; i < numberOfChannels; i++) {
        const rendereredData = e.renderedBuffer.getChannelData(i);
        const convolveData = convBuffer.getChannelData(i);

        // Check each value is what we would expect.
        let trackingValue = 0;
        const numberOfSamples = Math.min(rendereredData.length,
          convolveData.length);
        for (let j = 0; j < numberOfSamples; j++) {
          trackingValue += convolveData[j];
          if (Math.round(rendereredData[j]) !== trackingValue) {
            isConvolvedCorrectly = false;
          }
        }
      }

      expect(isConvolvedCorrectly).toBeTruthy();
      done();
    };
    context.startRendering();
  });

  xit('should apply delay correctly', () => {
    // TODO: Add a test to check that the delay is applied correctly. Currently
    // the delay is achieved by using a ScriptProcessorNode. This does not
    // currently function using an OfflineAudioContext.
  });
});
