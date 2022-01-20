/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import Loader from './loader';

/**
 * A class that provides Promise-based, asynchronous audio loading/decoding.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
 * @example
 * const context = new AudioContext();
 * const audioLoader = new bbcat.core.AudioLoader(context);
 *
 * audioLoader.load([
 *   'url/to/audio/1.m4a',
 *   'url/to/audio/2.m4a'
 * ]).then((decodedAudioArray) => {
 *   // Use the decoded audio (decodedAudioArray[0], decodedAudioArray[1])
 * }).catch((error) => {
 *   console.log(error);
 * });;
 */
export default class AudioLoader extends Loader {
  /**
   * Constructs a new {@link AudioLoader}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the
   *         {@link CompoundNode}.
   */
  constructor(context) {
    super('arraybuffer');
    this._context = context;
  }

  /**
   * Loads and decodes one or more audio files asynchronously.
   * @override
   * @param  {!(string|string[])} urls
   *         A single url or list of urls of audio files to load and decode.
   * @return {Promise}
   *         A Promise that resolves when all audio files have been loaded and
   *         decoded.
   */
  load(urls) {
    return super.load(urls);
  }

  /**
    * @private
    * Loads and decodes one audio file asynchronously.
    * @param  {!string} url
    *         A single url of an audio file to load and decoded.
    * @return {Promise}
    *         A Promise that resolves when the file has been loaded and decoded.
    */
  _loadOne(url) {
    return super._loadOne(url).then((data) => this._decode(data));
  }

  /**
   * @private
   * Decodes one audio file asynchronously.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
   * @param  {!ArrayBuffer} data
   *         An ArrayBuffer containing the audio data to be decoded.
   * @return {Promise}
   *         A Promise that resolves when the audio data has been decoded.
   */
  _decode(data) {
    return new Promise((resolve, reject) => {
      // Data must be copied to avoid issue with firefox losing reference.
      this._context.decodeAudioData(data.slice(0), resolve, reject);
    });
  }
}
