import bbcat from 'bbcat';
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
        return manifest;
      })
      .then((manifest) => {
        this.source = new DashSourceNode(this.audioContext, manifest);
        this.source.addEventListener('statechange', (e) => {
          if (e.state === 'playing') {
            this.state = 'playing';
          } else if (e.state === 'ready') {
            this.offset = this.currentTime;
            this.state = 'ready';
          }
        });
      })
      .then(() => this.connectOutputs())
      .then(() => {
        this.offset = initialOffset;
        this.lastInitial = initialOffset;
        return this.source.prime(initialOffset);
      });

    return this.preparePromise;
  }

  /**
   * Buffers the region requested and begins playing when it is available.
   *
   * @param {number} when - the context sync time to start playing at.
   * @param {number} offset - the content time to start playing from.
   *
   * @returns {Promise}
   */
  play(when = null, offset = this.offset) {
    return this.prepare(offset)
      .then(() => this.source.stop())
      .then(() => {
        if (this.source.state === 'primed' && this.lastInitial === offset) {
          // console.debug(`DashPlayer.play using pre-primed source node for offset = ${offset}.`);
          return Promise.resolve();
        }
        // console.debug(`DashPlayer.play priming again for offset = ${offset}.`);
        this.lastInitial = offset;
        return this.source.prime(offset);
      })
      .then(() => {
        this.when = when;
        if (when === null) {
          this.when = this.audioContext.currentTime;
        }
        this.offset = offset;
        this.source.start(this.when);
      });
  }

  /**
   * Connect DashSourceNode outputs to the player outputs.
   *
   * The DashSourceNode presents a mono output for every channel in any file. Multi-channel
   * files present multiple mono outputs, instead of a single multi-channel output.
   */
  connectOutputs() {
    this._outputs = this.source.outputs.map((output) => {
      const node = this.audioContext.createGain();
      output.connect(node);
      return node;
    });
  }


  /**
   * Stops all active sources playing immediately.
   *
   * @private
   */
  stopNow() {
    if (this.source !== null) {
      this.source.stop();
    }
  }

  /**
   * Pauses the player at a specified context syncTime.
   *
   * @param {number} when
   * @returns {Promise} resolving when the player has been stopped.
   */
  pause(when = this.audioContext.currentTime) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.stopNow();
        resolve();
      }, 1000 * (when - this.audioContext.currentTime));
    }).then(() => this);
  }


  /**
   * Get the current content time, the progress of the player.
   *
   * @returns {number}
   */
  get currentTime() {
    if (this.source === null) {
      return 0;
    }

    if (this.state === 'ready') {
      return this.offset;
    }

    const currentTime = this.audioContext.currentTime - (this.when - this.offset);
    return Math.max(this.offset, Math.min(currentTime, this.source.presentationDuration));
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
