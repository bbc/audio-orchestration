import uuidv4 from 'uuid/v4';

import Clocks from 'dvbcss-clocks';
import SyncPlayers from 'bbcat-orchestration/src/sync-players';
import SequenceRenderer from 'bbcat-orchestration/src/sequence-renderer';
import MdoAllocation from 'bbcat-orchestration/src/mdo-allocation';
import CloudSyncAdapter from 'bbcat-orchestration/src/sync/cloud-sync-adapter';
import Sync from 'bbcat-orchestration/src/sync/sync';

import {
  CLOUDSYNC_ENDPOINT,
  TIMELINE_TYPE,
  TIMELINE_TYPE_TICK_RATE,
  SEQUENCE_URLS,
  SESSION_CODE_LENGTH,
  CONTENT_ID,
} from '../../config';

const { AudioContextClock } = SyncPlayers;
const { Sequence, SynchronisedSequenceRenderer } = SequenceRenderer;
const { MdoAllocator, MdoReceiver } = MdoAllocation;
const { CorrelatedClock } = Clocks;

const setLoading = loading => ({
  type: 'SET_LOADING',
  loading,
});

const setConnected = connected => ({
  type: 'SET_CONNECTED',
  connected,
});

const setEnded = ended => ({
  type: 'SET_ENDED',
  ended,
});

const setSessionCode = sessionCode => ({
  type: 'SET_SESSION_CODE',
  sessionCode,
});

const setRole = role => ({
  type: 'SET_ROLE',
  role,
});

const setError = errorMessage => ({
  type: 'SET_ERROR',
  error: true,
  errorMessage,
});

const setPrimaryObject = objectId => ({
  type: 'SET_PRIMARY_OBJECT',
  objectId,
});

const setMuted = muted => ({
  type: 'SET_MUTED',
  muted,
});

const setTransportCapabilities = (canPause, canSeek) => ({
  type: 'SET_TRANSPORT_CAPABILITIES',
  canPause,
  canSeek,
});

// Shim for safari
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// global state holding references to orchestration and playback objects that need to be accessed
// from these actions at some point.
const orchestrationState = {
  initialised: false,
  sequences: [],
  currentContentId: null,
  masterClock: null,
  syncClock: null,
  renderers: {},
  audioContext: null,
  sysClock: null,
  sync: null,
  deviceId: null,
  master: false,
  volumeControl: null,
};

const requestSessionId = (userSessionCode) => {
  let sessionCode = userSessionCode;
  if (userSessionCode === undefined) {
    console.warn('Generating random session id, not guaranteed to be unique.');
    sessionCode = [...Array(SESSION_CODE_LENGTH).keys()]
      .map(() => `${Math.floor(Math.random() * 10)}`)
      .join('');
  }

  return Promise.resolve({
    sessionCode,
    sessionId: `bbcat-orchestration-${sessionCode}`,
  });
};

const generateDeviceId = () => `bbcat-orchestration-device-${uuidv4()}`;

const loadSequence = (url) => {
  console.debug('loadSequence', url);
  const {
    sequences,
    audioContext,
    master,
    syncClock,
    volumeControl,
  } = orchestrationState;

  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not download sequence data from ${url} (${response.status}).`);
      }
      return response.json();
    })
    .then(data => new Sequence(data))
    .then((sequence) => {
      // create a renderer but don't start it yet.
      const renderer = new SynchronisedSequenceRenderer(
        audioContext,
        syncClock,
        sequence,
        master, // isStereo
      );

      // connect renderer to output
      renderer.output.connect(volumeControl);

      // add the sequence, its url, and its renderer, to the list of available sequences.
      const contentId = url;
      const sequenceWrapper = {
        contentId,
        sequence,
        renderer,
      };

      sequences.push(sequenceWrapper);
      return sequenceWrapper;
    });
};

const selectPrimaryObject = (contentId, activeObjectIds) => (dispatch) => {
  console.warn('selectPrimaryObject not implemented');
  // using some list and the orchestration state's list of running sequences,
  // pick an object id that has a picture associated with it (based on some priority?)
  dispatch(setPrimaryObject(activeObjectIds[0]));
};

const updatePlaybackStatus = () => (dispatch) => {
  const {
    currentContentId,
    sequences,
    syncClock,
  } = orchestrationState;

  const sequenceWrapper = sequences.find(s => s.contentId === currentContentId);
  if (sequenceWrapper === undefined) {
    throw new Error(`currentContentId refers to unavailable sequence ${currentContentId}`);
  }
  const { renderer, sequence } = sequenceWrapper;

  const parentTime = Date.now() / 1000;
  const childTime = renderer.contentTime;
  const { duration } = sequence;
  const speed = syncClock.getEffectiveSpeed();

  dispatch({
    type: 'SET_PLAYBACK_STATUS',
    currentContentId,
    parentTime,
    childTime,
    duration,
    speed,
  });
};


/**
 * Interprets the schedule event to start or stop all loaded sequences.
 *
 * startSyncTime and stopSyncTime refer to a syncClock time and are passed to the renderer as is.
 * startOffset is 0 by default and is a time in seconds within the media, passed to start().
 */
const scheduleSequences = schedule => (dispatch) => {
  const { master, sequences, syncClock } = orchestrationState;

  sequences.forEach(({ renderer, sequence, contentId }) => {
    const sequenceSchedule = schedule.find(s => s.contentId === contentId);
    if (sequenceSchedule) {
      const { startSyncTime, stopSyncTime, startOffset } = sequenceSchedule;
      if (startSyncTime !== null) {
        // TODO: assumes only one sequence is active and the one most recently started becomes the
        // active sequence - this is the one that will be stopped by transitionToSequence.
        console.debug(`starting sequence ${contentId}`, renderer.activeObjectIds);

        // Starting the sequence and saving the current content id.
        renderer.start(startSyncTime, startOffset);
        orchestrationState.currentContentId = contentId;

        // Clear the ended flag because we just started playing a new sequence.
        dispatch(setEnded(false));

        // Only the master can pause or seek. Looped sequences can be paused, but not seeked in.
        dispatch(setTransportCapabilities(
          master, // canPause
          master && !sequence.loop, // canSeek
        ));

        // Listen for the ended event to update the UI.
        renderer.on('ended', () => {
          if (orchestrationState.currentContentId === contentId) {
            dispatch(setEnded(true));
          }
        });
      }

      if (stopSyncTime !== null) {
        console.debug(`stopping sequence ${contentId}`);
        renderer.stop(stopSyncTime);
      }
    } else {
      console.debug(`stopping unlisted sequence ${contentId}`);
      renderer.stop(syncClock.now());
    }
  });
  dispatch(updatePlaybackStatus());
};

export const transitionToSequence = contentId => (dispatch) => {
  const {
    mdoHelper,
    syncClock,
    currentContentId,
    sequences,
  } = orchestrationState;

  console.debug(sequences);

  const sequence = sequences.find(s => s.contentId === contentId);

  if (sequence === undefined) {
    throw new Error(`Requested sequence ${contentId} not loaded.`);
  }

  if (currentContentId === null) {
    mdoHelper.startSequence(contentId, syncClock.now() + 1.0 * syncClock.tickRate);
  } else {
    const { renderer } = sequences.find(s => s.contentId === currentContentId);
    const syncTime = renderer.stopAtOutPoint(1.0);
    mdoHelper.stopSequence(currentContentId, syncTime);
    mdoHelper.startSequence(contentId, syncTime);
  }

  dispatch(updatePlaybackStatus());
};

export const initialiseOrchestration = (master, {
  joinSessionCode = undefined,
} = {}) => (dispatch) => {
  if (orchestrationState.initialised === true) {
    throw new Error('Orchestration system has already been initialised.');
  }
  orchestrationState.initialised = true;

  dispatch(setLoading(true));

  const audioContext = new AudioContext();
  audioContext.resume();
  const volumeControl = audioContext.createGain();
  volumeControl.gain.value = 1.0;
  volumeControl.connect(audioContext.destination);
  const sysClock = new AudioContextClock({}, audioContext);
  const sync = new Sync(new CloudSyncAdapter({ sysClock }));
  const masterClock = new CorrelatedClock(sync.wallClock, {
    correlation: {
      parentTime: sync.wallClock.now(),
      childTime: 0,
    },
    speed: 1, // TODO: initial speed appears to be ignored by cloud sync, and always set to 1.
    tickRate: TIMELINE_TYPE_TICK_RATE,
  });
  const deviceId = generateDeviceId();

  Object.assign(orchestrationState, {
    master,
    audioContext,
    volumeControl,
    sysClock,
    masterClock,
    sync,
    deviceId,
  });

  // - Request/generate a full sessionId
  // - Connect to cloud sync service
  // - Provide and/or subscribe to the session-wide syncClock
  // - Load all sequences and create renderers
  // - Create the MDO Helper, subscribe all sequence renderers to it
  // - Update the user interface to indicate the connected state.

  orchestrationState.initPromise = requestSessionId(joinSessionCode)
    .then(({ sessionCode, sessionId }) => {
      dispatch(setSessionCode(sessionCode));
      return sync.connect(CLOUDSYNC_ENDPOINT, sessionId, deviceId);
    })
    .then(() => {
      if (master) {
        sync.provideTimelineClock(masterClock, TIMELINE_TYPE, CONTENT_ID);
      }

      return sync.requestTimelineClock(TIMELINE_TYPE, CONTENT_ID);
    })
    .then((timelineClock) => {
      orchestrationState.syncClock = timelineClock;
    })
    .catch((e) => {
      dispatch(setError(`Could not ${master ? 'create' : 'join'} session ${joinSessionCode}.`));
      throw e;
    })
    .then(() => Promise.all(SEQUENCE_URLS.map(loadSequence)))
    .catch((e) => {
      dispatch(setError('Downloading sequences failed.'));
      throw e;
    })
    .then((sequences) => {
      console.debug('loaded all sequences');
      if (master) {
        orchestrationState.mdoHelper = new MdoAllocator(deviceId);
      } else {
        orchestrationState.mdoHelper = new MdoReceiver(deviceId);
      }

      const { syncClock, mdoHelper } = orchestrationState;

      mdoHelper.on('change', ({ contentId, activeObjects }) => {
        dispatch(selectPrimaryObject(contentId, activeObjects));
        sequences.forEach((s) => {
          if (s.contentId === contentId) {
            s.renderer.setActiveObjectIds(activeObjects);
          }
        });
      });

      mdoHelper.on('schedule', (schedule) => {
        dispatch(scheduleSequences(schedule));
      });

      mdoHelper.start(sync);

      if (master) {
        // register the objects for all sequences.
        sequences.forEach((s) => {
          mdoHelper.registerObjects(s.sequence.objects, s.contentId);
        });

        // TODO: use a user provided initial sequence or wait for first play click before starting.
        dispatch(transitionToSequence(SEQUENCE_URLS[0]));
      }

      syncClock.on('change', () => {
        dispatch(updatePlaybackStatus());
      });

      syncClock.on('unavailable', () => {
        dispatch(setConnected(false));
      });

      syncClock.on('available', () => {
        dispatch(setConnected(true));
      });

      dispatch(setConnected(syncClock.getAvailabilityFlag()));
    })
    .then(() => {
      dispatch(setRole(master ? 'master' : 'slave'));
      dispatch(setLoading(false));

      sync.on('SyncServiceUnavailable', () => {
        console.error('SyncServiceUnavailable');
        dispatch(setError('Lost connection to synchronisation service.'));
      });
    })
    .catch((e) => {
      console.error('initialiseOrchestration', e);
      throw e;
    });
  return orchestrationState.initPromise;
};


export const play = () => (dispatch) => {
  const { masterClock, sync, master } = orchestrationState;

  if (!master) {
    return;
  }

  masterClock.setCorrelationAndSpeed({
    childTime: masterClock.now(),
    parentTime: sync.wallClock.now(),
  }, 1);
};

export const pause = () => (dispatch) => {
  const { masterClock, sync, master } = orchestrationState;

  if (!master) {
    return;
  }

  masterClock.setCorrelationAndSpeed({
    childTime: masterClock.now(),
    parentTime: sync.wallClock.now(),
  }, 0);
};

export const seek = (relativeSeconds) => (dispatch) => {
  const { masterClock, sync, master } = orchestrationState;

  if (!master) {
    return;
  }

  masterClock.setCorrelationAndSpeed({
    childTime: masterClock.now() + relativeSeconds * masterClock.tickRate,
    parentTime: sync.wallClock.now(),
  }, masterClock.speed);
};

export const mute = muted => (dispatch) => {
  const { volumeControl } = orchestrationState;
  if (muted) {
    volumeControl.gain.value = 0.0;
  } else {
    volumeControl.gain.value = 1.0;
  }
  dispatch(setMuted(muted));
};

export const log = message => (dispatch) => {
  console.debug(message);
};

export const setDeviceLocation = location => (dispatch) => {
  const { mdoHelper } = orchestrationState;
  mdoHelper.setLocation(location);

  dispatch({
    type: 'SET_DEVICE_LOCATION',
    location,
  });
};
