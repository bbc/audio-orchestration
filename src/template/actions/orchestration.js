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
  masterClock: null,
  syncClock: null,
  renderers: {},
  activeSequenceUrl: null,
  audioContext: null,
  sysClock: null,
  sync: null,
  deviceId: null,
  master: false,
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
      renderer.output.connect(audioContext.destination);

      // add the sequence, its url, and its renderer, to the list of available sequences.
      sequences.push({
        url,
        sequence,
        renderer,
      });
    });
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
  const sysClock = new AudioContextClock({}, audioContext);
  const sync = new Sync(new CloudSyncAdapter({ sysClock }));
  const masterClock = new CorrelatedClock(sync.wallClock, {
    correlation: {
      parentTime: wallClock.now(),
      childTime: 0,
    },
    speed: 0,
    tickRate: TIMELINE_TYPE_TICK_RATE,
  });
  const deviceId = generateDeviceId();

  Object.assign(orchestrationState, {
    master,
    audioContext,
    sysClock,
    masterClock,
    sync,
    deviceId,
  });

  // 1. Request/generate a full session id
  // 2. Store the session ID and connect to cloud sync service
  // 3. Create an MDO Helper for managing object allocations.
  // 4. Download all the sequence descriptions and initialise renderers
  // 5. If an initial sequence has been specified, start playing it.
  // 6. Dispatch actions changing the user interface to indicate the connection is ready.

  orchestrationState.initPromise = requestSessionId(joinSessionCode)
    .then(({ sessionCode, sessionId }) => {
      orchestrationState.sessionCode = sessionCode;
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
      if (master) {
        orchestrationState.mdoHelper = new MdoAllocator(deviceId);
      } else {
        orchestrationState.mdoHelper = new MdoReceiver(deviceId);
      }
      orchestrationState.mdoHelper.on('change', ({ contentId, activeObjects }) => {
        dispatch(selectPrimaryObject(contentId, activeObjects));
        sequences.forEach(({ url, renderer }) => {
          if (url === contentId) {
            renderer.setActiveObjectIds(activeObjects);
          }
        });
      });
      orchestrationState.mdoHelper.on('schedule', (schedule) => {
        dispatch(scheduleSequences(schedule));
      });
      orchestrationState.mdoHelper.start(sync);
    })
    .then(() => {
      console.debug('loaded all sequences');
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

};

export const pause = () => (dispatch) => {

};

export const seek = () => (dispatch) => {

};

export const mute = muted => (dispatch) => {

};

export const log = message => (dispatch) => {

};

export const setDeviceLocation = location => (dispatch) => {

};
