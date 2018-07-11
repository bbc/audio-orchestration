import bbcat from 'bbcat/src/bbcat.js';
import Player from './player';

const { ManifestLoader, ManifestParser, DashSourceNode } = bbcat.dash;

class DashPlayer extends Player {
  constructor(audioContext, manifestUrl, adaptationSetIds = null) {
    super(audioContext);

    /** @private */
    this.manifestUrl = manifestUrl;

    /** @private */
    this.adaptationSetIds = adaptationSetIds;

    /** @private */
    this.manifest = null;

    /** @private */
    this.source = null;

    /** @private */
    this.when = 0;

    /** @private */
    this.offset = 0;

    /** @private */
    this.preparePromise = null;

    /** @private */
    this.lastPrimePromise = Promise.resolve();

    /** @private */
    this.manifestLoader = new ManifestLoader();

    /** @private */
    this.manifestParser = new ManifestParser();

    /** @private */
    this.state = 'ready';
  }

  /**
   * Modifies the manifest object in place to remove all adaptation sets that are not in the
   * list of adaptationSetIds.
   *
   * @returns {Object} the filtered manifest
   * @private
   */
  filterManifest(manifest) {
    // If no specific adaptationSetIds have been specified, return the manifest unchanged.
    if (this.adaptationSetIds === null) {
      return manifest;
    }

    // Remove all adaptation sets from the parsed manifest, except for those matching this
    // player's adaptationSetIds.
    manifest.periods.forEach((p) => {
      manifest.periods[p.id].adaptationSets = p.adaptationSets.filter(a =>
        this.adaptationSetIds.includes(a.id));
    });

    return manifest;
  }

  /**
   * Replaces the current source with a new DashSourceNode, registering all required handlers etc.
   * @param {number} offset
   *
   * @returns {Promise<DashSourceNode>} resolving immediately. Use this.lastPrimePromise
   * to wait until the sourceNode is primed.
   */
  replaceSource(offset) {
    if (this.source !== null && this.source.state === 'primed' && this.source.playbackTime === offset) {
      // the requested source is equivalent to the current source. Nothing needs to be changed!
      // console.debug('replaceSource not replacing because source is equivalent.');
      return Promise.resolve(this.source);
    }

    // Clean up the previous source.
    if (this.source !== null) {
      const oldSource = this.source;

      // disconnect the outputs of the old source to mute it immediately.
      oldSource.outputs.forEach(output => output.disconnect());

      // wait for the priming to complete, because we can't cancel promises, then stop the source.
      this.lastPrimePromise.then(() => {
        oldSource.stop();
      });
    }

    // Create the new source
    const newSource = new DashSourceNode(this.audioContext, this.manifest);
    newSource.addEventListener('statechange', (e) => {
      // only using the source's state to detect when the stream has ended.
      // DashSourceNode states: ready -> priming -> primed -> playing -> ready
      // only do this if the source triggering the event is still the current source.
      if (newSource === this.source && e.state === 'ready') {
        this.state = 'ready';
      }
    });
    this.lastPrimePromise = newSource.prime(offset);

    // store the new source, set the current offset used for determining currentTime, and reset the
    // player state. It is ready until play() is called - regardless of prime promise completion.
    this.source = newSource;
    this.offset = offset;
    this.state = 'ready';

    return Promise.resolve(this.source);
  }

  /**
   * Prepares the player by loading, parsing, and filtering the DASH manifest,
   * and priming it to download the audio for playback from the beginning.
   *
   * {@link play}() will prime it again if a different offset is required.
   *
   * @param {number} initialOffset - the content time to prepare the player for,
   *    only used if the player is prepared for the first time.
   *
   * @returns {Promise<Object>} resolving to the manifest if successfully parsed
   * @private
   */
  prepare(initialOffset = 0) {
    // If we have previously started loading the manifest, return the same promise.
    if (this.preparePromise !== null) {
      return this.preparePromise;
    }

    this.preparePromise = this.manifestLoader
      .load(this.manifestUrl)
      .then(manifestBlob => this.manifestParser.parse(manifestBlob))
      .then(manifest => this.filterManifest(manifest))
      .then((manifest) => {
        this.manifest = manifest;
      })
      .then(() => this.replaceSource(initialOffset))
      .then((source) => {
        this._outputs = source.outputs.map(() => this.audioContext.createGain());
      })
      .then(() => this.connectOutputs());

    return this.preparePromise;
  }

  /**
   * Buffers the region requested and begins playing when it is available.
   *
   * TODO: The play method may be called again by the sync controller before the prime promise has
   *       resolved. Thie may cause prime to be called before the source node is ready to accept it.
   *       In this case, we currently catch the error and pause the player, however, this should be
   *       handled once the DashSourceNode natively supports seek() without an explicit call to
   *       prime. We cannot cancel promises.
   *
   * @param {number} when - the context sync time to start playing at.
   * @param {number} offset - the content time to start playing from.
   *
   * @returns {Promise}
   */
  play(when = null, offset = this.offset) {
    // console.debug(`play when = ${when}, offset = ${offset}`);
    this.when = when || 0;

    this.prepare(offset)
      .then(() => this.replaceSource(offset))
      .then(() => this.connectOutputs())
      .then(() => {
        this.state = 'playing';
        this.lastPrimePromise.then(() => {
          if (this.source.state === 'primed') {
            this.source.start(this.when);
          } else {
            console.warn('PrimePromise resolved but source not primed. Source may have changed?');
          }
        });
      });
  }

  /**
   * Connect DashSourceNode outputs to the player outputs.
   *
   * The DashSourceNode presents a mono output for every channel in any file. Multi-channel
   * files present multiple mono outputs, instead of a single multi-channel output.
   */
  connectOutputs() {
    this.source.outputs.forEach((output, i) => {
      output.connect(this.outputs[i]);
    });
  }

  /**
   * Pauses the player.
   *
   * @returns {Promise} resolving when the player has been stopped.
   */
  pause() {
    this.offset = this.currentTime;
    this.when = this.audioContext.currentTime;

    if (this.state === 'playing') {
      this.state = 'ready';
      return this.replaceSource(this.offset);
    }

    return Promise.resolve();
  }

  /**
   * Get the current content time, the progress of the player.
   *
   * @returns {number}
   */
  get currentTime() {
    return this.audioContext.currentTime - (this.when - this.offset);
  }

  /**
   * Get the current playback rate (0 = paused, 1 = playing)
   *
   * @returns {number}
   */
  get playbackRate() {
    if (this.state === 'playing') {
      return 1;
    }
    return 0;
  }

  /**
   * get the default buffering delay for this type of player.
   *
   * @returns {number}
   */
  /* eslint-disable-next-line class-methods-use-this */
  get defaultBufferingDelay() {
    return 0;
  }

  get duration() {
    if (this.source === null) {
      return 0;
    }
    return this.source.presentationDuration;
  }
}

export default DashPlayer;
