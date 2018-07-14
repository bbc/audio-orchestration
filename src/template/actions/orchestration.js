import uuidv4 from 'uuid/v4';
// This is the entrance to the rabbit hole.

import Clocks from 'dvbcss-clocks';
import SyncPlayers from 'bbcat-orchestration/src/sync-players';
import SequenceRenderer from 'bbcat-orchestration/src/sequence-renderer';
import MdoAllocation from 'bbcat-orchestration/src/mdo-allocation';
import CloudSyncAdapter from 'bbcat-orchestration/src/sync/cloud-sync-adapter';
import Sync from 'bbcat-orchestration/src/sync/sync';

import { CLOUDSYNC_ENDPOINT, TIMELINE_TYPE } from '../../config';

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

// Shim for safari
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// global state holding references to orchestration and playback objects that need to be accessed
// from these actions at some point.
const orchestrationState = {
  initialised: false,
  sequences: [],
  renderers: {},
  activeSequenceId: null,
  audioContext: null,
  sysClock: null,
  sync: null,
  deviceId: null,
};

const requestSessionId = (userSessionCode) => {
  let sessionCode = userSessionCode;
  if (userSessionCode === undefined) {
    console.warn('Generating random session id, not guaranteed to be unique.');
    sessionCode = [...Array(6).keys()]
      .map(() => `${Math.floor(Math.random() * 10)}`)
      .join('');
  }

  return Promise.resolve({
    sessionCode,
    sessionId: `bbcat-orchestration-${sessionCode}`,
  });
};

const generateDeviceId = () => `bbcat-orchestration-device-${uuidv4()}`;

const loadSequence = url => fetch(url)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Could not download sequence data from ${url} (${response.status}).`);
    }
    return response.json();
  })
  .then(data => new Sequence(data))
  .then(sequence => orchestrationState.sequences.push(sequence));

const startSequence = (sequenceId) => {
  const sequence = orchestrationState.sequences.find(s => s.id === sequenceId);
  if (sequence === undefined) {
    throw new Error(`Sequence '${sequenceId}' not found.`);
  }
};

export const initialiseOrchestration = (master, {
  joinSessionCode = undefined,
  sequenceUrls = [],
  initialSequenceId,
} = {}) => (dispatch) => {
  if (orchestrationState.initialised === true) {
    throw new Error('Orchestration system has already been initialised.');
  }
  orchestrationState.initialised = true;
  dispatch(setLoading(true));

  const audioContext = new AudioContext();
  audioContext.resume();
  const sysClock = new AudioContextClock({}, audioContext);
  const sync = new Sync(new CloudSyncAdapter({ sysClock }));
  const deviceId = generateDeviceId();

  Object.assign(orchestrationState, {
    master,
    audioContext,
    sysClock,
    sync,
    deviceId,
    sequenceUrls,
  });

  // 1. Download all the sequence descriptions - TODO: should be separate.
  // 2. Request/generate a full session id
  // 3. Store the session ID and connect to cloud sync service
  // 4. Create an MDO Helper for managing object allocations.
  // 5. If an initial sequence has been specified, create its renderer.
  // 6. Dispatch actions changing the user interface to indicate the connection is ready.

  Promise.all(sequenceUrls.map(loadSequence))
    .then(() => requestSessionId(joinSessionCode))
    .catch((e) => {
      dispatch(setError(`Could not join session ${joinSessionCode}.`));
      throw e;
    })
    .then(({ sessionCode, sessionId }) => {
      orchestrationState.sessionCode = sessionCode;
      dispatch(setSessionCode(sessionCode));
      return sync.connect(CLOUDSYNC_ENDPOINT, sessionId, deviceId);
    })
    .then(() => {
      if (master) {
        orchestrationState.mdoHelper = new MdoAllocator(deviceId);
      } else {
        orchestrationState.mdoHelper = new MdoReceiver(deviceId);
      }
      orchestrationState.mdoHelper.start(sync);
    })
    .then(() => {
      const sequence = orchestrationState.sequences.find(s => s.id === initialSequenceId);
      if (sequence !== undefined) {
        dispatch(startSequence(sequence.id));
      }
    })
    .then(() => {
      dispatch(setRole(master ? 'master' : 'slave'));
      dispatch(setLoading(false));
      sync.on('SyncServiceUnavailable', () => {
        console.error('SyncServiceUnavailable');
        setError('Lost connection to synchronisation service');
      });
    })
    .catch((e) => {
      console.error('initialiseOrchestration', e);
      throw e;
    });
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
