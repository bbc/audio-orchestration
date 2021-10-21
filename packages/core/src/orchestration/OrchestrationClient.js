/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import CorrelatedClock from 'dvbcss-clocks/src/CorrelatedClock';
import {
  ImageContext,
} from '../playback';
import {
  Sequence,
  SequenceRenderer,
} from '../rendering';
import MainDeviceHelper from './MainDeviceHelper';
import AuxDeviceHelper from './AuxDeviceHelper';

import {
  AudioContextClock,
  Synchroniser,
  CloudSyncAdapter,
} from '../synchronisation';

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
 * sequences. Only one sequence may be active at a time, and the main device may trigger a
 * transition to another sequence at any time.
 *
 * @example
 * import { OrchestrationClient } from '@bbc/audio-orchestration-core/src/orchestration';
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
 * orchestration.on('status', (e) => { console.log('playback status changed.', e); });
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
   * @param {Object} [options] - optional options for the underlying services.
   */
  constructor(options = {}) {
    super();

    this._initialised = false;
    this._ready = false;
    this._initialContentId = options.initialContentId || null;
    this._audioContext = null;
    this._sequences = {};
    this._contentIds = [];
    this._currentContentId = null;
    this._contentId = options.contentId || CONTENT_ID;
    this._syncEndpoint = options.cloudSyncEndpoint || CLOUDSYNC_ENDPOINT;
    this._loadingTimeout = options.loadingTimeout || LOADING_TIMEOUT;
    this._sequenceTransitionDelay = options.sequenceTransitionDelay || SEQUENCE_TRANSITION_DELAY;
    this._deviceId = options.deviceId || OrchestrationClient.generateDeviceId();
    this._isSafari = options.isSafari || false;
    this._controls = options.controls || [];
    this._activeControlIds = {};
    this._allocationAlgorithm = options.allocationAlgorithm || null;
    this._gain = 1.0;
    this._playbackOffset = 0;
    this._objectFadeOutDuration = options.objectFadeOutDuration || 0;
    this._imageContext = null;
  }

  /**
   * Creates an audio context. Should be called from a user gesture event (e.g. click) to pass
   * browser restrictions on playing audio only after user interaction.
   *
   * The returned audio context can then be passed into start().
   *
   * @returns {AudioContext} - a running audio context.
   */
  static createAudioContext() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    const audioContext = new AudioContext();
    audioContext.resume();

    // create a dummy source that is imperceptably quiet and always playing to keep the page alive.
    const dummySource = audioContext.createOscillator();
    dummySource.frequency.value = 50;
    const dummyGain = audioContext.createGain();
    dummyGain.gain.value = 1.0e-10;
    dummySource.connect(dummyGain);
    dummyGain.connect(audioContext.destination);
    dummySource.start();

    return audioContext;
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
   * Emits a 'change' event with the current content id and all allocations and device information.
   *
   * @private
   *
   * @fires 'change'
   */
  _publishChangeEvent() {
    this.emit('change', {
      currentContentId: this.currentContentId,
      objectAllocations: this.objectAllocations,
      controlAllocations: this.controlAllocations,
      devices: this.devices,
    });
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
      primaryObjectImage,
    } = (sequence.getPrimaryObjectInfo(activeObjectIds) || {});

    this.emit('objects', {
      currentContentId,
      activeObjectIds,
      primaryObjectId,
      primaryObjectImage,
    });
  }

  /**
   * Emits a 'controls' event with a list of currently active controls.
   */
  _publishControlsEvent() {
    const currentContentId = this._currentContentId;
    const activeControlIds = this._activeControlIds[currentContentId];

    if (!activeControlIds) {
      return;
    }

    this.emit('controls', {
      activeControlIds,
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
      .map((contentId) => this._sequences[contentId])
      .forEach(({ renderer, contentId }) => {
        const sequenceSchedule = schedule.find((s) => s.contentId === contentId);

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
    this._publishStatusEvent();
    this._publishObjectsEvent();
    this._publishControlsEvent();
    this._publishChangeEvent();
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
   * Creates a global volume control and connects it to the context destination.
   * Also creates a dynamics compressor initially disabled.
   *
   * The audio graph is [renderer] -> rendererOutput -> compressor -> volumeControl -> destination.
   *
   * @private
   *
   * @returns {GainNode} - A gain node connected, via some additional routing, to the audio
   * context destination.
   */
  _createAudioGraph() {
    this.emit('loading', 'connecting audio output');
    this._volumeControl = this._audioContext.createGain();
    this._volumeControl.gain.value = this._gain;
    this._volumeControl.connect(this._audioContext.destination);

    this._compressor = this._audioContext.createDynamicsCompressor();
    // threshold and ratio are overwritten later,
    // initially the threshold is 0, to disable the compressor.
    this._compressor.threshold.value = 0;
    this._compressor.ratio.value = 2;

    // default timing settings are not exposed explicitly.
    this._compressor.attack.value = 0.01;
    this._compressor.release.value = 0.25;

    this._compressor.connect(this._volumeControl);

    this._rendererOutput = this._audioContext.createGain();
    this._rendererOutput.connect(this._compressor);

    return this._rendererOutput;
  }

  /**
   * Creates a system clock, sync component, and main clock.
   *
   * @returns {CorrelatedClock} - the primary clock used on the main device to control the
   * experience timeline.
   *
   * @private
   */
  _createSynchronisedClocks() {
    this.emit('loading', 'creating clocks');
    this._sysClock = new AudioContextClock({}, this._audioContext);
    this._sync = new Synchroniser(new CloudSyncAdapter({ sysClock: this._sysClock }));
    const { wallClock } = this._sync;
    this._primaryClock = new CorrelatedClock(wallClock, {
      correlation: {
        parentTime: wallClock.now(),
        childTime: 0,
      },
      speed: 0,
      tickRate: TIMELINE_TYPE_TICK_RATE,
    });

    return this._primaryClock;
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
    return new Promise((resolve, reject) => {
      this._sync.connect(this._syncEndpoint, this._sessionId, this._deviceId)
        .then(resolve)
        .catch(reject);
      setTimeout(() => {
        reject(new Error('Timeout connecting to the synchronisation server.'));
      }, this._loadingTimeout);
    });
  }

  /**
   * Requests (and provides, if this is the main device) the experience synchronisation clock.
   *
   * @returns {Promise<CorrelatedClock>} - A promise resolving when the synchronised clock is
   * available.
   */
  _requestSyncClock() {
    this.emit('loading', 'synchronising clocks');
    if (this._isMain) {
      this._sync.provideTimelineClock(this._primaryClock, TIMELINE_TYPE, this._contentId);
    }

    return new Promise((resolve, reject) => {
      this._sync.requestTimelineClock(TIMELINE_TYPE, this._contentId)
        .then((syncClock) => {
          this._syncClockOriginal = syncClock;
          this._syncClock = new CorrelatedClock(
            this._syncClockOriginal,
            { correlation: [0, this._playbackOffset] },
          );

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
        .then((data) => new Sequence(data))
        .then((sequence) => {
          sequenceWrapper.sequence = sequence;

          // create a renderer but don't start it yet.
          const renderer = new SequenceRenderer(
            this._audioContext,
            this._syncClock,
            sequence,
            {
              isSafari: this._isSafari,
              objectFadeOutDuration: this._objectFadeOutDuration,
              imageContext: this._imageContext,
            },
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
      if (this._isMain) {
        this._mdoHelper = new MainDeviceHelper(
          this._deviceId,
          {
            allocationAlgorithm: this._allocationAlgorithm,
          },
        );
      } else {
        this._mdoHelper = new AuxDeviceHelper(this._deviceId);
      }

      this._mdoHelper.on('change', ({ contentId }) => {
        // Update all sequence renderers with new allocations
        const sequenceWrapper = this._sequences[contentId];
        if (sequenceWrapper !== undefined) {
          sequenceWrapper.renderer.setActiveObjects(this._mdoHelper.getActiveObjects(contentId));
        }

        // Update the list of controls assigned to this device
        this._activeControlIds[contentId] = this._mdoHelper.getActiveControls(contentId);

        // Schedule the sequence renderers and dispatch change events
        this._scheduleSequences(this.schedule);

        // resolve the createHelper promise once the first metadata change has been received.
        resolve(this._mdoHelper);
      });

      // Emit custom message events
      this._mdoHelper.on('message', (message) => {
        this.emit('message', message);
      });

      // Start listening for broadcast messages, send request for schedule and allocations.
      this._mdoHelper.start(this._sync);

      // Register the sequence objects and start playing the first one.
      // The main device transitionToSequence causes a schedule event on all devices.
      if (this._isMain) {
        // set the controls
        this._mdoHelper.setControls(this._controls);
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

  _emitImage(image) {
    this.emit('image', image);
  }

  /**
   * Initialises the class and connects to all the required services.
   *
   * @param {boolean} isMain - whether this client acts as a main main, controlling the experience,
   * or an aux device, synchronising to another device.
   * @param {string} sessionId - a unique session id.
   * @param {AudioContext?} audioContext - an AudioContext to use, if one has already been created
   * by the application.
   *
   * @returns {Promise}
   */
  start(isMain, sessionId, audioContext = null) {
    return new Promise((resolve) => {
      if (this._initialised) {
        throw new Error('Orchestration client is already initialised.');
      }

      if (audioContext !== null) {
        this._audioContext = audioContext;
      } else {
        this._audioContext = OrchestrationClient.createAudioContext();
      }

      this._imageContext = new ImageContext((image) => this._emitImage(image), this._audioContext);
      this._imageContext.resume();

      this._initialised = true;
      this._isMain = isMain;
      this._sessionId = sessionId;

      resolve();
    })
      .then(() => this._createAudioGraph())
      .then(() => this._createSynchronisedClocks())
      .then(() => this._connectToSync())
      .then(() => this._requestSyncClock())
      .then(() => this._prepareSequences())
      .then(() => this._createHelper())
      .then(() => {
        this._ready = true;
        this.emit('loaded');
        this.play();
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
      ...this._contentIds.filter((c) => c !== contentId),
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
   * Continues playing the current sequence from the current time. Can only be used on the main
   * device.
   */
  play() {
    if (!this._ready || !this._isMain) {
      return;
    }

    this._primaryClock.setCorrelationAndSpeed({
      childTime: this._primaryClock.now(),
      parentTime: this._sync.wallClock.now(),
    }, 1);
  }

  /**
   * Pauses the experience timeline and any content currently playing. Can only be used on the
   * main device.
   */
  pause() {
    if (!this._ready || !this._isMain) {
      return;
    }

    this._primaryClock.setCorrelationAndSpeed({
      childTime: this._primaryClock.now(),
      parentTime: this._sync.wallClock.now(),
    }, 0);
  }

  /**
   * Seeks in the experience timeline by a relative amount of seconds. Can only be used on the
   * main device.
   *
   * @param {number} relativeOffset - relative seek offset in seconds
   */
  seek(relativeOffset) {
    if (!this._ready || !this._isMain) {
      return;
    }

    this._primaryClock.setCorrelation({
      childTime: this._primaryClock.now() + (relativeOffset * this._primaryClock.tickRate),
      parentTime: this._sync.wallClock.now(),
    });
  }

  /**
   * Schedules a transition from the current sequence to the given contentId. Can only be used
   * on the main device.
   *
   * @param {string} contentId
   */
  transitionToSequence(contentId) {
    // used internally, during startup, so cannot test for _ready here.
    if (!this._isMain || !this._initialised) {
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

    this.play();
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
      this._volumeControl.gain.value = this._gain;
    }

    this.emit('mute', muted);
  }

  /**
   * Sets some device metadata. Overwrites existing values with the same key. Commonly used
   * metadata keys are deviceControls, deviceType, deviceGain, deviceLatency.
   *
   * @param {Object} metadata
   */
  setDeviceMetadata(metadata) {
    if (!this._ready) {
      return;
    }
    this._mdoHelper.setDeviceMetadata(metadata);
  }

  // eslint-disable-next-line class-methods-use-this
  get master() {
    throw new Error('OrchestrationClient.master has been renamed to isMain.');
  }

  get isMain() {
    return this._isMain;
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
   * Sets the gain value.
   *
   * @param {number} gain - decibel gain value of the device.
   */
  setGain(gain = 0.0) {
    this._gain = 10 ** (gain / 20);
    if (this._volumeControl) {
      this._volumeControl.gain.value = this._gain;
    }
  }

  /**
   * Sets the playback offset.
   *
   * @param {number} offset - offset value in milliseconds of the device.
   */
  setPlaybackOffset(offset = 0) {
    this._playbackOffset = Math.min(1000, Math.max(-1000, offset));
    if (this._syncClock) {
      this._syncClock.setCorrelation([0, this._playbackOffset]);
    }
  }

  /**
   * Send a custom message to all devices in the same session.
   *
   * @param {object} message
   */
  sendMessage(message) {
    if (this._mdoHelper) {
      this._mdoHelper.sendCustomMessage(message);
    }
  }

  /**
   * Returns the deviceId assigned to this instance.
   */
  get deviceId() {
    return this._deviceId;
  }

  /**
   * Returns all object allocations for all sequences for all devices.
   */
  get objectAllocations() {
    return (this._mdoHelper || {}).objectAllocations || {};
  }

  /**
   * Returns all control allocations for all devices.
   */
  get controlAllocations() {
    return (this._mdoHelper || {}).controlAllocations || {};
  }

  /**
   * Returns all devices and their metadata
   */
  get devices() {
    return (this._mdoHelper || {}).devices || [];
  }

  /**
   * Returns scheduled start and end times for all scheduled sequences
   */
  get schedule() {
    return (this._mdoHelper || {}).schedule || [];
  }

  /**
   * Cleans up and disconnects from all the required services.
   */
  destroy() {
    this._sync.destroy();
  }
}

export default OrchestrationClient;
