
// A class that mocks the Web Audio API AudioContext.

export default class MockAudioContext {
  constructor(numOfChannels = 2, length = 1, sampleRate = 48000) {
    const Context = window.OfflineAudioContext || window.OfflineAudioContext;
    this._context = new Context(numOfChannels, length, sampleRate);
    this._currentTime = 0;

    this.bufferSourceStartCallback = () => {};
    this.bufferSourceStopCallback = () => {};
  }

  get destination() {
    return this._context.destination;
  }

  get sampleRate() {
    return this._context.sampleRate;
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

    bufferSource._start = bufferSource.start;
    bufferSource.start = (when, offset, duration) => {
      bufferSource._start(when, offset, duration);
      this.bufferSourceStartCallback(when, offset, duration);
    };

    bufferSource._stop = bufferSource.stop;
    bufferSource.stop = () => {
      bufferSource._stop();
      this.bufferSourceStopCallback();
    };

    return bufferSource;
  }

  createGain() {
    return this._context.createGain();
  }

  decodeAudioData(data, resolve, reject) {
    return this._context.decodeAudioData(data, resolve, reject);
  }

  startRendering() {
    return this._context.startRendering();
  }
}
