import Loader from './loader';

export default class AudioLoader extends Loader {
  constructor(context) {
    super('arraybuffer');
    this.context = context;
  }

  _loadOne(url) {
    return super._loadOne(url).then((data) => this._decode(data));
  }

  _decode(data) {
    return new Promise((resolve, reject) => {
      this.context.decodeAudioData(data, resolve, reject);
    });
  }
}
