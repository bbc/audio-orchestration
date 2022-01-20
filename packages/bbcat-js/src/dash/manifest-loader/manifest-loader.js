/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import Loader from '../../core/loaders/loader';

/**
 * A class that provides Promise-based, asynchronous DASH Manifest loading.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document
 * @see http://mpeg.chiariglione.org/standards/mpeg-dash
 * @example
 * const manifestLoader = new bbcat.dash.ManifestLoader();
 * const manifestParser = new bbcat.dash.ManifestParser();
 *
 * manifestLoader.load('http://example.org/manifest.mpd').then((doc) => {
 *  const manifest = manifestParser.parse(doc);
 *  // Use manifest.mediaPresentationDuration etc.
 * });
 */
export default class ManifestLoader extends Loader {
  /**
   * Constructs a new {@link ManifestLoader}.
   */
  constructor() {
    super('text');
    this._parser = new DOMParser();
  }

  /**
   * Loads one or more manifest files asynchronously and converts them to
   * documents.
   * @override
   * @param  {!(string|string[])} urls
   *         A single url or list of urls of manifest files to load and convert.
   * @return {Promise}
   *         A Promise that resolves when all manifest files have been loaded
   *         and converted to documents.
   */
  load(urls) {
    return super.load(urls);
  }

  /**
   * Loads and converts one manifest file asynchronously.
   * @private
   * @param  {!string} url
   *         A single url of a manifest file to load and decoded.
   * @return {Promise}
   *         A Promise that resolves when the manifest has been loaded.
   */
  _loadOne(url) {
    return super._loadOne(url).then((string) => this._parse(string));
  }

  /**
   * Converts one manifest blob to a document.
   * @private
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document
   * @param  {!string} string
   *         A string blob containing the manifest to be converted.
   * @return {Promise}
   *         A Promise that resolves when the manifest blob has been converted.
   */
  _parse(string) {
    const xml = this._parser.parseFromString(string, 'text/xml');
    return Promise.resolve(xml);
  }
}
