
// A class that mocks the Web Audio API AudioContext.

export default class MockAudioContext {
  constructor() {
    if (!window.testAudioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      window.testAudioContext = new AudioContext();
    }

    this._context = window.testAudioContext;
    this._currentTime = 0;
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(currentTime) {
    this._currentTime = currentTime;
  }

  createChannelSplitter(channelCount) {
    return this._context.createChannelSplitter(channelCount);
  }

  createBufferSource() {
    const bufferSource = this._context.createBufferSource();
    bufferSource.start = (when, offset, duration) => {
      // Do stuff in here with params.
    }
    return bufferSource;
  }
}
