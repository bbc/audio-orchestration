
// A class that mocks the Web Audio API AudioContext.

export default class MockAudioContext {
  constructor() {
    if (!window.testAudioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      window.testAudioContext = new AudioContext();
    }

    this._context = window.testAudioContext;
    this._currentTime = 0;

    this.bufferSourceStartCallback = () => {};
    this.bufferSourceStopCallback = () => {};
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(currentTime) {
    this._currentTime = currentTime;
  }

  get sampleRate() {
    return this._context.sampleRate;
  }

  createChannelSplitter(channelCount) {
    return this._context.createChannelSplitter(channelCount);
  }

  createBufferSource() {
    const bufferSource = this._context.createBufferSource();
    bufferSource.start = this.bufferSourceStartCallback;
    bufferSource.stop =  this.bufferSourceStopCallback;
    return bufferSource;
  }



  createGain() {
    return this._context.createGain();
  }

  decodeAudioData(data, resolve, reject) {
    return this._context.decodeAudioData(data, resolve, reject);
  }
}
