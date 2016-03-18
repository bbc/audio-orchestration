import Loader from '../../core/loaders/loader';

export default class ManifestLoader extends Loader {
  constructor() {
    super('text');
  }

  _loadOne(url) {
    return super._loadOne(url).then(this._parse);
  }

  _parse(string) {
    // TODO consider moving parser to constructor?
    const parser = new DOMParser();
    const xml = parser.parseFromString(string, 'text/xml', 0);
    return Promise.resolve(xml);
  }
}
