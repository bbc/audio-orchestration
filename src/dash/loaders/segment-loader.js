import Loader from '../../core/loaders/loader';

export default class SegmentLoader extends Loader {
  constructor(context) {
    super('arraybuffer');
    this.context = context;
  }

  __loadOne(url) {
    return super.__loadOne(url).then((text) => {
      return this.__decode(text);
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
