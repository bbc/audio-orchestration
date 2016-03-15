import Loader from '../../core/loaders/loader';

export default class AudioLoader extends Loader {
  constructor(context) {
    super('arraybuffer');
    this.context = context;
  }

  __loadOne(url) {
    return super.__loadOne(url).then((data) => {
      return this.__decode(data);
    });
  }

  __decode(data) {
    return new Promise(
      (resolve, reject) => {
        this.context.decodeAudioData(data, resolve, reject);
      }
    );
  }
}
