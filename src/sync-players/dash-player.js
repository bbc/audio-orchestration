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
    this.manifestPromise = null;

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
   * Prepares the player by loading, parsing, and filtering the DASH manifest.
   *
   * @returns {Promise<Object>} resolving to the manifest if successfully parsed
   * @private
   */
  prepare() {
    // If we have previously started loading the manifest, return the same promise.
    if (this.manifestPromise !== null) {
      return this.manifestPromise;
    }

    this.manifestPromise = this.manifestLoader
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
          console.log(e.state);
          if (e.state === 'playing') {
            this.state = 'playing';
          } else if (e.state === 'ready') {
            this.offset = this.currentTime;
            this.state = 'ready';
          }
        });
      })
      .then(() => this.connectOutputs(this.source));

    return this.manifestPromise;
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
    console.debug('DashPlayer.play', this.audioContext.currentTime, 'offset', offset);
    return this.prepare()
      .then(() => this.source.stop())
      .then(() => this.source.prime(offset))
      .then(() => {
        this.when = when;
        if (when === null) {
          this.when = this.audioContext.currentTime;
        }
        this.offset = offset;
        console.debug('DashPlayer.play, starting at:', this.when);
        this.source.start(this.when);
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
   *       Instead, a bbcat-js Renderer should be used, and the DashPlayer should just output
   *       a multi-channel output like the dash source node.
   */
  connectOutputs(source) {
    const channelMapping = [];
    const merger = this.audioContext.createChannelMerger(2);
    merger.connect(this.output);

    this.manifest.periods.forEach((period) => {
      period.adaptationSets.forEach((adaptationSet) => {
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
      console.debug(i, ' => ', channelMapping[i].join(', '));
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
