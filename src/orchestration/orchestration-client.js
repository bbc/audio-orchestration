import EventEmitter from 'events';
import uuidv4 from 'uuid/v4';
import Clocks from 'dvbcss-clocks';
import AudioContextClock from '../sync-players/audio-context-clock';
import Sequence from '../sequence-renderer/sequence';
import SynchronisedSequenceRenderer from '../sequence-renderer/sequence-renderer';
import MdoAllocator from '../mdo-allocation/mdo-allocator';
import MdoReceiver from '../mdo-allocation/mdo-receiver';
import CloudSyncAdapter from '../sync/cloud-sync-adapter';
import Sync from '../sync/sync';

const { CorrelatedClock } = Clocks;

const CLOUDSYNC_ENDPOINT = 'mqttbroker.edge.platform.2immerse.eu';
const CONTENT_ID = 'github.com/bbc/bbcat-orchestration-template/syncClock';

const LOADING_TIMEOUT = 5000;
const SEQUENCE_TRANSITION_DELAY = 1.0;

const TIMELINE_TYPE = 'tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000';
const TIMELINE_TYPE_TICK_RATE = 1000;

/**
 * @class OrchestrationClient
 *
 * A single point of entry for standard orchestrated devices experiences. Hides a lot of the setup
 * complexity involved in using the components directly. Provides a simple interface for a user
 * interface to call into and fires events to update the user interface state.
 *
 * It manages multiple sequence renderers, transport controls, and the transition between
 * sequences. Only one sequence may be active at a time, and the master device may trigger a
 * transition to another sequence at any time.
 *
 * @example
 * import OrchestrationClient from 'bbcat-orchestration/src/orchestration/orchestration-client';
 *
 * const orchestration = new OrchestrationClient({});
 *
 * orchestration.registerSequence(contentId, sequenceUrl);
 * orchestration.registerSequence(otherContentId, otherSequenceUrl);
 * orchestration.setInitialSequence(contentId);
 *
 * orchestration.on('error', (e) => { console.log(e.message); });
 * orchestration.on('loaded', () => { console.log('loaded sequences'); });
 * orchestration.on('connected', () => { console.log('connected'); });
 * orchestration.on('disconnected', () => { console.log('disconnected'); });
 * orchestration.on('change', (e) => { console.log('playback status changed.', e); });
 * orchestration.on('ready', () => { console.log('ready to interact'); });
 *
 * orchestration.start(true, sessionId).then(() => {
 *   nextBtn.on('click', () => orchestration.transitionToSequence(otherContentId));
 *   skipBtn.on('click', () => orchestration.seek(30));
 * });
 *
 */
class OrchestrationClient extends EventEmitter {
  /**
   * Constructs an orchestration client.
   *
   * Before calling player methods, register your sequences ([@link registerSequence]),
   * add your event handlers, call [@link start]() and wait for the returned promise to resolve,
   * indicating that the class is ready to be used.
   *
   * @param [options] - optional options for the underlying services.
   */
  constructor(options = {}) {
    super();

    this._initialised = false;
    this._ready = false;
    this._initialContentId = null;
    this._audioContext = null;
    this._sequences = {};
    this._contentIds = [];
    this._currentContentId = null;
    this._contentId = options.contentId || CONTENT_ID;
    this._syncEndpoint = options.cloudSyncEndpoint || CLOUDSYNC_ENDPOINT;
    this._loadingTimeout = options.loadingTimeout || LOADING_TIMEOUT;
    this._sequenceTransitionDelay = options.sequenceTransitionDelay || SEQUENCE_TRANSITION_DELAY;
    this._deviceId = options.deviceId || OrchestrationClient.generateDeviceId();
  }

  /**
   * Emits a 'status' event with all information about the current playhead status. This is fired
   * frequently, on changes to the renderer clock or the current contentId.
   *
   * @private
   *
   * @fires 'status'
   */
  _publishStatusEvent() {
    try {
      const currentContentId = this._currentContentId;
      const sequenceWrapper = this._sequences[currentContentId];

      if (sequenceWrapper === undefined) {
        return;
      }

      const { renderer, sequence } = sequenceWrapper;

      const dateNowTime = Date.now() / 1000;
      const { contentTime } = renderer;
      const speed = this._syncClock.getEffectiveSpeed();

      const { duration, loop } = sequence;


      this.emit('status', {
        currentContentId,
        dateNowTime,
        contentTime,
        speed,
        duration,
        loop,
      });
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Emits an 'objects' event with information about the currently active objects,
   * and the selected primary object if available.
   *
   * @private
   *
   * @fires 'objects'
   */
  _publishObjectsEvent() {
    const currentContentId = this._currentContentId;
    const sequenceWrapper = this._sequences[currentContentId];

    if (sequenceWrapper === undefined) {
      return;
    }

    const { renderer, sequence } = sequenceWrapper;
    const { activeObjectIds } = renderer;

    const {
      primaryObjectId,
      primaryObjectImageUrl,
    } = (sequence.getPrimaryObjectInfo(activeObjectIds) || {});

    this.emit('objects', {
      currentContentId,
      activeObjectIds,
      primaryObjectId,
      primaryObjectImageUrl,
    });
  }

  /**
   * Parses and acts on a sequence schedule received from the [@link MdoHelper]. Schedules audio
   * playback for this local device in response.
   *
   * @param {Array<Object>} schedule
   */
  _scheduleSequences(schedule) {
    this._contentIds
      .map(contentId => this._sequences[contentId])
      .forEach(({ renderer, contentId }) => {
        const sequenceSchedule = schedule.find(s => s.contentId === contentId);

        if (sequenceSchedule) {
          const { startSyncTime, stopSyncTime, startOffset } = sequenceSchedule;
          if (startSyncTime !== null) {
            // console.debug(`start ${contentId} at ${startSyncTime}.`);
            renderer.start(startSyncTime, startOffset);
            this._currentContentId = contentId;
            this.emit('ended', false);
          }

          if (stopSyncTime !== null) {
            // console.debug(`stop ${contentId} at ${stopSyncTime}.`);
            renderer.stop(stopSyncTime);
          }
        } else {
          renderer.stop(this._syncClock.now());
        }
      });
    this.play();
    this._publishStatusEvent();
    this._publishObjectsEvent();
  }

  /**
   * Generates random deviceId string based on a UUID.
   *
   * @returns {string} deviceId
   */
  static generateDeviceId() {
    return `bbcat-orchestration-device:${uuidv4()}`;
  }

  /**
   * Creates an audio context. Should be called from a user gesture event (e.g. click) to pass
   * browser restrictions on playing audio only after user interaction.
   *
   * @private
   *
   * @returns {AudioContext} - a running audio context.
   */
  _createAudioContext() {
    this.emit('loading', 'creating audio context');
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    this._audioContext = new AudioContext();
    this._audioContext.resume();

    // create a dummy source that is imperceptably quiet and always playing to keep the page alive.
    const dummySource = this._audioContext.createOscillator();
    dummySource.frequency.value = 50;
    const dummyGain = this._audioContext.createGain();
    dummyGain.gain.value = 1.0e-10;
    dummySource.connect(dummyGain);
    dummyGain.connect(this._audioContext.destination);
    dummySource.start();

    // create a unity-gain node that the renderer output will be connected to. This can be
    // connected to further processing, such as compression and volume controls.
    this._rendererOutput = this._audioContext.createGain();

    return this._audioContext;
  }

  /**
   * Creates a global volume control and connects it to the context destination.
   * Also creates a dynamics compressor initially disabled.
   *
   * @private
   *
   * @returns {GainNode} - A gain node connected directly to the audio context destination with the
   * current gain set to 1.0.
   */
  _createVolumeControl() {
    this.emit('loading', 'creating volume control');
    this._volumeControl = this._audioContext.createGain();
    this._volumeControl.gain.value = 1.0;
    this._volumeControl.connect(this._audioContext.destination);

    this._compressor = this._audioContext.createDynamicsCompressor();
    this._compressor.threshold.value = 0;
    this._compressor.ratio.value = 8;

    this._compressor.connect(this._volumeControl);

    this._rendererOutput.connect(this._compressor);

    return this._volumeControl;
  }

  /**
   * Creates a system clock, sync component, and master clock.
   *
   * @returns {CorrelatedClock} - the master clock used on the main device to control the experience
   * timeline.
   *
   * @private
   */
  _createSynchronisedClocks() {
    this.emit('loading', 'creating clocks');
    this._sysClock = new AudioContextClock({}, this._audioContext);
    this._sync = new Sync(new CloudSyncAdapter({ sysClock: this._sysClock }));
    const { wallClock } = this._sync;
    this._masterClock = new CorrelatedClock(wallClock, {
      correlation: {
        parentTime: wallClock.now(),
        childTime: 0,
      },
      speed: 0,
      tickRate: TIMELINE_TYPE_TICK_RATE,
    });

    return this._masterClock;
  }

  /**
   * Connects to the synchronisation service initialised in [@link createSynchronisedClocks].
   *
   * @returns {Promise} - A promise resolving when a successful connection has been established.
   *
   * @private
   */
  _connectToSync() {
    this.emit('loading', 'connecting to synchronisation server');
    this._sync.on('connected', () => this.emit('connected'));
    this._sync.on('disconnected', () => {
      // console.debug('disconnected - pausing and muting output');
      this.emit('disconnected');
      this.pause();
      this.mute(true);
    });
    return this._sync.connect(this._syncEndpoint, this._sessionId, this._deviceId);
  }

  /**
   * Requests (and provides, if this is a master) the experience synchronisation clock.
   *
   * @returns {Promise<CorrelatedClock>} - A promise resolving when the synchronised clock is
   * available.
   */
  _requestSyncClock() {
    this.emit('loading', 'synchronising clocks');
    if (this._master) {
      this._sync.provideTimelineClock(this._masterClock, TIMELINE_TYPE, this._contentId);
    }

    return new Promise((resolve, reject) => {
      this._sync.requestTimelineClock(TIMELINE_TYPE, this._contentId)
        .then((syncClock) => {
          this._syncClock = syncClock;
          resolve(this._syncClock);
        });
      setTimeout(() => {
        reject(new Error('Timeout waiting for synchronised clock. Session code may have been incorrect or main device may have gone away.'));
      }, this._loadingTimeout);
    }).then((syncClock) => {
      syncClock.on('change', () => this._publishStatusEvent());
      syncClock.on('unavailable', () => {
        this.emit('unavailable');
      });
      return syncClock;
    });
  }

  /**
   * Loads all registered sequences and creates their renderer objects.
   *
   * @private
   *
   * @returns {Promise<Object>} - a mapping of contentId to { sequence, renderer }.
   */
  _prepareSequences() {
    return Promise.all(this._contentIds.map((contentId) => {
      const sequenceWrapper = this._sequences[contentId];
      const { url } = sequenceWrapper;

      return fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Could not download sequence data from ${url} (${response.status}).`);
          }
          return response.json();
        })
        .then(data => new Sequence(data))
        .then((sequence) => {
          sequenceWrapper.sequence = sequence;

          // create a renderer but don't start it yet.
          const renderer = new SynchronisedSequenceRenderer(
            this._audioContext,
            this._syncClock,
            sequence,
            this._master, // isStereo
          );

          renderer.on('ended', () => {
            if (contentId === this.currentContentId) {
              this.emit('ended', true);
              this.pause();
            }
          });

          // connect renderer to output
          renderer.output.connect(this._rendererOutput);
          return renderer;
        })
        .then((renderer) => {
          sequenceWrapper.renderer = renderer;
        });
    })).then(() => this._sequences);
  }

  /**
   * Create the MdoHelper object managing allocations, register events on it, and set it to start
   * listening for messages on the sync client.
   *
   * @private
   *
   * @returns {Promise<MdoHelper>} - A promise resolving when the helper is connected and has
   * received a first schedule update.
   */
  _createHelper() {
    this.emit('loading', 'waiting for object allocations and schedule');

    return new Promise((resolve, reject) => {
      // Create mdoHelper
      if (this._master) {
        this._mdoHelper = new MdoAllocator(this._deviceId);

        this._mdoHelper.on('change', () => {
          this.emit('devices', this._mdoHelper.getAuxiliaryDevices());
        });
      } else {
        this._mdoHelper = new MdoReceiver(this._deviceId);
      }

      this._mdoHelper.on('change', ({ contentId, activeObjects }) => {
        // Update all sequence renderers with new allocations
        const sequenceWrapper = this._sequences[contentId];
        if (sequenceWrapper !== undefined) {
          sequenceWrapper.renderer.setActiveObjectIds(activeObjects);
        }

        this._publishObjectsEvent();
      });

      // resolve the promise once the schedule with the initial sequence has been received.
      this._mdoHelper.on('schedule', (schedule) => {
        this._scheduleSequences(schedule);
        resolve(this._mdoHelper);
      });

      // Start listening for broadcast messages, send request for schedule and allocations.
      this._mdoHelper.start(this._sync);

      // Register the sequence objects and start playing the first one.
      // The master device transitionToSequence causes a schedule event on all devices.
      if (this._master) {
        // register the objects for all sequences.
        Object.values(this._sequences).forEach((s) => {
          this._mdoHelper.registerObjects(s.sequence.objects, s.contentId);
        });

        // Trigger a transition to the initial sequence, needed to guarantee a schedule event.
        this.transitionToSequence(this._initialContentId);
      }

      setTimeout(() => {
        reject(new Error('Timeout waiting for schedule update'));
      }, this._loadingTimeout);
    });
  }

  /**
   * Initialises the class and connects to all the required services.
   *
   * @param {boolean} master - whether this client acts as a master, controlling the experience, or
   * a slave, synchronising to a master running on another device.
   * @param {string} sessionId - a unique session id.
   *
   * @returns {Promise}
   */
  start(master, sessionId) {
    return new Promise((resolve) => {
      if (this._initialised) {
        throw new Error('Orchestration client is already initialised.');
      }
      this._initialised = true;
      this._master = master;
      this._sessionId = sessionId;
      resolve();
    })
      .then(() => this._createAudioContext())
      .then(() => this._createVolumeControl())
      .then(() => this._createSynchronisedClocks())
      .then(() => this._connectToSync())
      .then(() => this._requestSyncClock())
      .then(() => this._prepareSequences())
      .then(() => this._createHelper())
      .then(() => {
        this.emit('loaded');
        this._ready = true;
        return this;
      })
      .catch((e) => {
        this.emit('error', e);
        // console.debug('error (in start) - pausing and muting output');
        this.pause();
        this.mute(true);
        throw e;
      });
  }

  /**
   * Registers a sequence url matched to its contentId. The contentId is used to identify the
   * currently playing sequence in change events, and to schedule the transition to another
   * sequence.
   *
   * Register all sequences before calling [@link start]. The sequence metadata is downloaded as
   * part of the start process.
   *
   * @param {string} contentId - a unique (among registered sequences) reference string.
   * @param {string} url - the url to the sequence.json metadata file.
   */
  registerSequence(contentId, url) {
    this._contentIds = [
      ...this._contentIds.filter(c => c !== contentId),
      contentId,
    ];

    this._sequences[contentId] = {
      contentId,
      url,
    };

    // by default use the first registered sequence as the initial contentId.
    if (this._initialContentId === null) {
      this._initialContentId = contentId;
    }
  }

  /**
   * Continues playing the current sequence from the current time. Can only be used on the master
   * device.
   */
  play() {
    if (!this._ready || !this._master) {
      return;
    }

    this._masterClock.setCorrelationAndSpeed({
      childTime: this._masterClock.now(),
      parentTime: this._sync.wallClock.now(),
    }, 1);
  }

  /**
   * Pauses the experience timeline and any content currently playing. Can only be used on the
   * master device.
   */
  pause() {
    if (!this._ready || !this._master) {
      return;
    }

    this._masterClock.setCorrelationAndSpeed({
      childTime: this._masterClock.now(),
      parentTime: this._sync.wallClock.now(),
    }, 0);
  }

  /**
   * Seeks in the experience timeline by a relative amount of seconds. Can only be used on the
   * master device.
   *
   * @param {number} relativeOffset - relative seek offset in seconds
   */
  seek(relativeOffset) {
    if (!this._ready || !this._master) {
      return;
    }

    this._masterClock.setCorrelation({
      childTime: this._masterClock.now() + (relativeOffset * this._masterClock.tickRate),
      parentTime: this._sync.wallClock.now(),
    });
  }

  /**
   * Schedules a transition from the current sequence to the given contentId. Can only be used
   * on the master device.
   *
   * @param {string} contentId
   */
  transitionToSequence(contentId) {
    // used internally, during startup, so cannot test for _ready here.
    if (!this._master || !this._initialised) {
      return;
    }

    // console.debug('transitioning from currentContentId:', this._currentContentId);

    const sequenceWrapper = this._sequences[contentId];
    if (sequenceWrapper === undefined) {
      this.emit(
        'error',
        new Error(`Cannot transition to contentId ${contentId}, sequence must be registered before calling start().`),
      );
      return;
    }

    if (this._currentContentId === null) {
      // console.debug('transition now.');
      // no sequence is currently playing.
      this._mdoHelper.startSequence(
        contentId,
        this._syncClock.now() + (this._sequenceTransitionDelay * this._syncClock.tickRate),
      );
    } else {
      // find a suitable transition point in the currently playing sequence.
      const { renderer } = this._sequences[this._currentContentId];
      const syncTime = renderer.stopAtOutPoint(this._sequenceTransitionDelay);
      // console.debug(`transition outPoint at ${syncTime}, now: ${this._syncClock.now()}`);

      this._mdoHelper.stopSequence(this._currentContentId, syncTime);
      this._mdoHelper.startSequence(contentId, syncTime);
    }
  }

  /**
   * Mutes the output locally on this device.
   *
   * @param {boolean} muted
   */
  mute(muted = false) {
    if (!this._ready) {
      return;
    }

    if (muted) {
      this._volumeControl.gain.value = 0.0;
    } else {
      this._volumeControl.gain.value = 1.0;
    }

    this.emit('mute', muted);
  }

  /**
   * Sets the device location for this device.
   *
   * @param {Object} location
   * @param {string} location.distance - use 'near' or 'far'
   * @param {string} location.direction - use 'front', 'side', or 'rear'
   */
  setDeviceLocation(location) {
    if (!this._ready) {
      return;
    }
    this._mdoHelper.setLocation(location);
  }

  get master() {
    return this._master;
  }

  get currentContentId() {
    return this._currentContentId;
  }

  /**
   * Sets the dynamics compressor ratio value.
   *
   * @param {number} ratio - between 1 and 20
   */
  setCompressorRatio(ratio) {
    this._compressor.ratio.value = ratio;
  }

  /**
   * Sets the dynamics compressor threshold value. Set it to 0 to disable the compressor.
   *
   * @param {number} threshold - decibel threshold above which the compression will take effect.
   */
  setCompressorThreshold(threshold = -50) {
    this._compressor.threshold.value = threshold;
  }

  /**
   * Returns the deviceId assigned to this instance.
   */
  get deviceId() {
    return this._deviceId;
  }
}

export default OrchestrationClient;
