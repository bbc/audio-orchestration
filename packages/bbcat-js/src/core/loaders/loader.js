/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/**
 * A class that provides Promise-based, asynchronous file loading.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * @example
 * const jsonLoader = new bbcat.core.Loader(json);
 *
 * jsonLoader.load([
 *   'url/to/json/1.json',
 *   'url/to/json/2.json'
 * ]).then((jsonArray) {
 *   // Use the json objects (jsonArray[0], jsonArray[1])
 * }).catch(function(error) {
 *   console.log(error);
 * });;
 */
export default class Loader {
  /**
   * Constructs a new {@link Loader}.
   * @param  {!string} responseType
   *         The response type the loader should handle. Valid values are
   *         arraybuffer, blob, document, json or text.
   */
  constructor(responseType) {
    this._responseType = responseType || 'arraybuffer';
  }

  /**
   * Loads one or more files asynchronously.
   * @param  {!(string|string[])} urls
   *         A single url or list of urls of files to load.
   * @return {Promise}
   *         A Promise that resolves when all files have been loaded.
   */
  load(urls) {
    return urls instanceof Array
      ? this._loadAll(urls)
      : this._loadOne(urls);
  }

  /**
   * @private
   * Loads one file asynchronously. Promotes overloading in subclasses to add
   * pre- and post-load processing.
   * @param  {!string} url
   *         A single url of file to load.
   * @return {Promise}
   *         A Promise that resolves when the file has been loaded.
   */
  _loadOne(url) {
    return this._request(url);
  }

  /**
   * @private
   * Loads multiple files asynchronously. Promotes overloading in subclasses to
   * add pre- and post-load processing.
   * @param  {!string[]} urls
   *         A list of urls of files to load.
   * @return {Promise}
   *         A Promise that resolves when all files have been loaded.
   */
  _loadAll(urls) {
    return Promise.all(urls.map((url) => this._loadOne(url)));
  }

  /**
   * @private
   * Loads a single file at the specified URL using the XMLHttpRequest API.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
   * @param  {!string} url
   *         A single url of file to load.
   * @return {Promise}
   *         A Promise that resolves when the file has been loaded.
   */
  _request(url) {
    return new Promise(
      (resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = this._responseType;

        request.addEventListener('load', function onLoadEvent() {
          // Any correct response will enter this method including 403
          // (Forbidden), 404 (Not Found) etc. The only responses that
          // indicate true success are 200 (OK) and 304 (Not Modified).
          if (this.status === 200 || this.status === 304) {
            resolve(request.response);
          } else {
            reject(new Error(this.statusText));
          }
        });

        request.addEventListener('error', () => {
          // Transport error has occured.
          reject(new Error('A transport error has occured.'));
        });

        request.send();
      },
    );
  }
}
