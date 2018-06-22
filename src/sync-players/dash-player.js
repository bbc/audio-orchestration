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
    this.previousSource = null;

    /** @private */
    this.when = 0;

    /** @private */
    this.offset = 0;

    /** @private */
    this.manifestPromise = null;
  }

  /**
   * Prepares the player by loading and parsing the DASH manifest.
   *
   * @returns {Promise<Object>} resolving to the manifest if successfully parsed
   * @private
   */
  prepare() {
    // If we have previously started loading the manifest, return the same promise.
    if (this.manifestPromise !== null) {
      return this.manifestPromise;
    }

    this.manifestPromise = new ManifestLoader().load(this.manifestUrl)
      .then((manifestBlob) => {
        // Parse the manifest
        const manifest = new ManifestParser().parse(manifestBlob);

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

        // Resolve to the filtered manifest.
        return manifest;
      })
      .catch((e) => {
        this.manifestPromise = null;
        throw e;
      })
      .then((manifest) => {
        console.debug(manifest);
        this.manifest = manifest;
        return manifest;
      });

    return this.manifestPromise;
  }

  /**
   * Buffers the region requested and begins playing when it is available.
   *
   * @param {number} when - the context sync time to start playing at.
   * @param {number} offset - the content time to start playing from.
   *
   * @returns {Promise<DashPlayer>}
   */
  play(when = this.audioContext.currentTime, offset = this.offset) {
    return this.prepare().then((manifest) => {
      // check that offset is valid
      if (offset < 0 || offset > this.manifest.mediaPresentationDuration) {
        throw new Error('offset must be >= 0 and < manifest.mediaPresentationDuration.');
      }

      // if we already have a playing source, stop it.
      // However, a DashSourceNode can not be stopped at a sync time, so instead,
      // we wait for the new stream to begin playing before stopping this one.
      if (this.source !== null) {
        if (this.previousSource !== null) {
          this.previousSource.stop();
        }
        this.previousSource = this.source;
      }

      // save new start time and offset.
      this.when = when;
      this.offset = offset;

      // create new source
      const currentSource = new DashSourceNode(this.audioContext, manifest);
      this.source = currentSource;
      this.connectOutputs(currentSource);

      this.source.addEventListener('statechange', (e) => {
        console.debug('DashPlayer source.statechange:', e.state);
        if (e.state === 'playing') {
          if (currentSource === this.source) {
            this.state = 'playing';
            if (this.previousSource !== null) {
              this.previousSource.stop();
            }
          }
        } else if (e.state === 'ready') {
          // if it hasn't been replaced already, update the player state.
          // set offset to current position to handle pause/resume.
          // The ended event on DashSourceNode is only triggered when the end of media is reached.
          if (currentSource === this.source) {
            this.offset = this.currentTime;
            this.state = 'ready';
          }
        }
      });

      return this.source.prime(offset)
        .then(() => this.source.start(when))
        .then(() => this);
    });
  }

  /**
   * Connects outputs from a DashSourceNode to the correct output channels based on the
   * manifest's AudioChannelConfiguration property.
   *
   * The DashSourceNode presents a mono output for every channel in any file. Multi-channel
   * files present multiple mono outputs, instead of a single multi-channel output.
   *
   * TODO: Currently assuming that the output rendering will be stereo.
   *       Instead, a bbcat-js Renderer should be used.
   */
  connectOutputs(source) {
    const channelMapping = [];
    const merger = this.audioContext.createChannelMerger(2);
    merger.connect(this.output);

    this.manifest.periods.forEach((period) => {
      console.debug(period);
      period.adaptationSets.forEach((adaptationSet) => {
        console.debug(adaptationSet);
        const count = adaptationSet.audioChannelConfiguration.value;
        if (count === 1) {
          channelMapping.push([0, 1]);
        } else if (count === 2) {
          channelMapping.push([0]);
          channelMapping.push([1]);
        } else {
          for (let i = 0; i < count; i += 1) {
            channelMapping.push([0, 1]);
          }
        }
      });
    });

    source.outputs.forEach((output, i) => {
      console.debug(i, channelMapping[i]);
      channelMapping[i].forEach((outputChannel) => {
        output.connect(merger, 0, outputChannel);
      });
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
    if (this.previousSource !== null) {
      this.previousSource.stop();
    }
  }

  /**
   * @param when
   */
  pause(when) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.stopNow();
        resolve();
      }, 1000 * (when - this.audioContext.currentTime));
    }).then(() => this);
  }

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
}

export default DashPlayer;
