
// A class that mocks the Web Audio API AudioContext.

export default class MockAudioContext {
  static createAudioContext(numOfChannels = 2, length = 1, sampleRate = 48000) {
    const Context = window.OfflineAudioContext;
    const context = new Context(numOfChannels, length, sampleRate);

    // Add a setter alongside currentTime getter..
    context._currentTime = 0;
    Object.defineProperty(context, 'currentTime', {
      get: function get() { return context._currentTime; },
      set: function set(value) { context._currentTime = value; },
    });

    // Allow callbacks on BufferSource start and stop.
    context.bufferSourceStartCallback = () => {};
    context.bufferSourceStopCallback = () => {};

    context._createBufferSource = context.createBufferSource;
    context.createBufferSource = () => {
      const bufferSource = context._createBufferSource();

      bufferSource._start = bufferSource.start;
      bufferSource.start = (when, offset, duration) => {
        bufferSource._start(when, offset, duration);
        context.bufferSourceStartCallback(when, offset, duration);
      };

      bufferSource._stop = bufferSource.stop;
      bufferSource.stop = () => {
        bufferSource._stop();
        context.bufferSourceStopCallback();
      };

      return bufferSource;
    };

    return context;
  }
}
