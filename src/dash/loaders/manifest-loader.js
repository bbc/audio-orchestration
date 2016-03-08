import Loader from '../../core/loaders/loader';

export default class ManifestLoader extends Loader {
  constructor() {
    super('text');
  }

  __loadOne(url) {
    return super.__loadOne(url).then((text) => {
      return this.__parse(text);
    });
  }

  __parse(string) {
    // TODO consider moving parser to constructor?
    const parser = new DOMParser();
    const xml = parser.parseFromString(string, 'text/xml', 0);
    return Promise.resolve(xml);
  }
}
