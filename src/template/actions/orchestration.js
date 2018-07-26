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

const setPlaying = playing => ({
  type: 'SET_PLAYING',
  playing,
});

const selectPrimaryObject = (contentId, activeObjectIds) => (dispatch) => {
  console.warn('selectPrimaryObject not implemented');
  // using some list and the orchestration state's list of running sequences,
  // pick an object id that has a picture associated with it (based on some priority?)
  dispatch(setPrimaryObject(activeObjectIds[0]));
};

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

/**
 * Interprets the schedule event to start or stop all loaded sequences.
 *
 * startSyncTime and stopSyncTime refer to a syncClock time and are passed to the renderer as is.
 * startOffset is 0 by default and is a time in seconds within the media, passed to start().
 */
const scheduleSequences = schedule => (dispatch) => {
  const { sequences, syncClock } = orchestrationState;

  sequences.forEach(({ renderer, contentId }) => {
    const sequenceSchedule = schedule.find(s => s.contentId === contentId);
    if (sequenceSchedule) {
      const { startSyncTime, stopSyncTime, startOffset } = sequenceSchedule;
      if (startSyncTime !== null) {
        console.debug(`starting sequence ${contentId}`, renderer.activeObjectIds);
        renderer.start(startSyncTime, startOffset);
        orchestrationState.currentContentId = contentId;
        // TODO: assumes only one sequence is active and the one most recently started becomes the
        // active sequence - this is the one that will be stopped by transitionToSequence.
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
    const { renderer } = sequences.find(({ contentId }) => contentId === currentContentId);
    const syncTime = renderer.stopAtOutPoint(1.0);
    mdoHelper.stopSequence(currentContentId, syncTime);
    mdoHelper.startSequence(contentId, syncTime);
  }
};

export const initialiseOrchestration = (master, {
  joinSessionCode = undefined,
} = {}) => (dispatch) => {
  if (orchestrationState.initialised === true) {
    throw new Error('Orchestration system has already been initialised.');
  }
  orchestrationState.initialised = true;

  dispatch(setLoading(true));
  dispatch(setRole(master ? 'master' : 'slave'));

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
        if (syncClock.getEffectiveSpeed() === 0) {
          dispatch(setPlaying(false));
        } else {
          dispatch(setPlaying(true));
        }
      });
    })
    .then(() => {
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
};
