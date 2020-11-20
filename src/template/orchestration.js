import bowser from 'bowser';
import { takeEvery, call, put } from 'redux-saga/effects';
import { OrchestrationClient } from '@bbc/bbcat-orchestration';

import config from 'config';
import {
  addLoadingMessage,
  setConnected,
  setDisconnected,
  setEnded,
  setErrorMessage,
  setAllocationsAndDevices,
  setPrimaryObject,
  setActiveObjectIds,
  setActiveControlIds,
  setMuted,
  setTransportCapabilities,
  setPlaybackStatus,
  setSequenceChoices,
  setDeviceGain,
  setDevicePlaybackOffset,
  receivedCalibrationMessage,
} from 'actions/orchestration';

import {
  initialiseCalibrationOrchestration,
} from './calibrationOrchestration';

let dispatch = null;

// A global browser detection object
const browser = bowser.getParser(window.navigator.userAgent);
const isSafari = browser.is('Safari') || browser.is('iOS');

// A global reference to the audio context. It has to be created on a user action and then passed
// into OrchestrationClient.start().
let globalAudioContext = null;

// A global orchestration object - this is the only instance of it. It is started with a sessionId,
// deviceId, and audioContext reference in connectOrchestration.
let globalOrchestrationClient = null;

// A global object (controlId => controlValues[]) of current values for all controls on this device.
// TODO: This replicates state, listening to the same Redux actions to keep up to date, and that is
// a bit ugly.
const globalDeviceControlValues = {};

/**
 * Ensure an audio context exists.
 */
export const ensureAudioContext = () => {
  if (globalAudioContext !== null) {
    globalAudioContext.resume();
  } else {
    globalAudioContext = OrchestrationClient.createAudioContext();
  }
  return globalAudioContext;
};

/**
 * Initialise the orchestration object by registering the sequences to load and setting up
 * event handlers. The event handlers dispatch actions that expose the orchestration state to the
 * user interface, via the redux state.
 *
 * @param {function} dispatch - the redux store's dispatch method.
 *
 * @returns {string} deviceId
 */
export const initialiseOrchestration = (dispatchFunction) => {
  dispatch = dispatchFunction;
  let transitionOnEnded = null;

  globalOrchestrationClient = new OrchestrationClient({
    initialContentId: config.INITIAL_CONTENT_ID,
    cloudSyncEndpoint: config.CLOUDSYNC_ENDPOINT,
    sequenceTransitionDelay: config.SEQUENCE_TRANSITION_DELAY,
    loadingTimeout: config.LOADING_TIMEOUT,
    contentId: config.SYNC_CLOCK_CONTENT_ID,
    controls: config.CONTROLS,
    isStereo: config.ENABLE_STEREO_ON_AUX_DEVICES,
    isSafari,
  });

  config.SEQUENCE_URLS.forEach(({ contentId, url }) => {
    globalOrchestrationClient.registerSequence(contentId, url);
  });

  globalOrchestrationClient.on('loading', (message) => {
    if (message !== false) {
      dispatch(addLoadingMessage(message));
    }
  });

  globalOrchestrationClient.on('status', (e) => {
    dispatch(setPlaybackStatus({
      currentContentId: e.currentContentId,
      duration: e.duration,
      loop: e.loop,
      speed: e.speed,
      parentTime: e.dateNowTime,
      childTime: e.contentTime,
    }));

    dispatch(setTransportCapabilities({
      canSeek: globalOrchestrationClient.isMain,
      canPause: globalOrchestrationClient.isMain,
    }));

    if (globalOrchestrationClient.isMain) {
      const {
        next,
        skippable,
        hold,
      } = config.SEQUENCE_URLS.find(({ contentId }) => contentId === e.currentContentId);

      if (!hold && !e.loop && next.length > 0) {
        transitionOnEnded = next[0].contentId;
      } else {
        transitionOnEnded = null;
      }

      dispatch(setSequenceChoices({
        choices: next,
        skippable,
        hold,
      }));
    }
  });

  globalOrchestrationClient.on('change', () => {
    const {
      currentContentId,
      objectAllocations,
      controlAllocations,
      devices,
    } = globalOrchestrationClient;

    // Only put allocations for the current sequence into the state.
    dispatch(setAllocationsAndDevices({
      objectAllocations: objectAllocations[currentContentId] || {},
      controlAllocations: controlAllocations[currentContentId] || {},
      connectedDevices: devices || [],
    }));
  });

  globalOrchestrationClient.on('objects', (e) => {
    dispatch(setActiveObjectIds(e.activeObjectIds));
    dispatch(setPrimaryObject(e.primaryObjectId, e.primaryObjectImage));
  });

  globalOrchestrationClient.on('controls', (e) => {
    dispatch(setActiveControlIds(e.activeControlIds));
  });

  globalOrchestrationClient.on('mute', (muted) => dispatch(setMuted(muted)));

  globalOrchestrationClient.on('connected', () => dispatch(setConnected()));

  globalOrchestrationClient.on('disconnected', () => {
    dispatch(setDisconnected());
  });

  globalOrchestrationClient.on('unavailable', () => {
    dispatch(setDisconnected());
  });

  globalOrchestrationClient.on('error', (e) => {
    dispatch(setErrorMessage(e.message));
  });

  globalOrchestrationClient.on('ended', (ended) => {
    dispatch(setEnded(ended));

    if (ended && globalOrchestrationClient.isMain && transitionOnEnded !== null) {
      const nextContentId = transitionOnEnded;
      transitionOnEnded = null;
      // TODO: the orchestration client/renderer pause after emitting the ended event, so can't
      // request a transition immediately. This is a hack that works most of the time.
      setTimeout(() => {
        globalOrchestrationClient.transitionToSequence(nextContentId);
      }, 300);
    }
  });

  globalOrchestrationClient.on('unavailable', () => {
    globalOrchestrationClient.mute(true);
    globalOrchestrationClient.pause();
  });

  globalOrchestrationClient.on('available', () => {
    globalOrchestrationClient.mute(false);
  });

  globalOrchestrationClient.on('disconnected', () => {
    globalOrchestrationClient.mute(true);
  });

  globalOrchestrationClient.on('loaded', () => {
    globalOrchestrationClient.setDeviceMetadata({
      deviceType: browser.getPlatform().type,
    });
  });

  globalOrchestrationClient.on('message', (message) => {
    dispatch(receivedCalibrationMessage(message));
  });

  return globalOrchestrationClient.deviceId;
};

export const connectOrchestration = (isMain, sessionId) => globalOrchestrationClient.start(
  isMain,
  sessionId,
  globalAudioContext,
)
  .then(() => {
    if (!isMain) {
      globalOrchestrationClient.setCompressorRatio(config.MDO_COMPRESSOR_RATIO);
      globalOrchestrationClient.setCompressorThreshold(config.MDO_COMPRESSOR_THRESHOLD);
    }
  })
  .then(() => ({ success: true }))
  .then(() => {
    initialiseCalibrationOrchestration({
      dispatch,
      ensureAudioContext,
      isSafari,
      isMain: globalOrchestrationClient.isMain,
      deviceId: globalOrchestrationClient.deviceId,
    });
  })
  .catch((e) => {
    console.error('connectOrchestration error:', e);
    throw e || new Error('Unknown error in connectOrchestration');
  });

function* transitionToSequence({ contentId }) {
  yield call(() => globalOrchestrationClient.transitionToSequence(contentId));
}

function* play() {
  yield call(() => globalOrchestrationClient.play());
}

function* pause() {
  yield call(() => globalOrchestrationClient.pause());
}

function* seek({ relativeOffset }) {
  yield call(() => globalOrchestrationClient.seek(relativeOffset));
}

function* mute() {
  yield call(() => globalOrchestrationClient.mute(true));
}

function* unmute() {
  yield call(() => globalOrchestrationClient.mute(false));
}

function* setDeviceControls({ controlValues }) {
  // Keep the globalDeviceControlValues in sync by replacing any values stored for controls that are
  // included in this update.
  Object.entries(controlValues).forEach(([k, v]) => {
    globalDeviceControlValues[k] = v;
  });

  // Set the deviceControls in the device metadata, which is a complete list of all controls
  yield call(() => globalOrchestrationClient.setDeviceMetadata({
    deviceControls: Object.entries(globalDeviceControlValues).map(([k, v]) => ({
      controlId: k,
      controlValues: v,
    })),
  }));
}

function* setGain({ gain }) {
  yield call(() => { globalOrchestrationClient.setGain(gain); });
  yield put(setDeviceGain(gain));
}

function* setPlaybackOffset({ offset }) {
  yield call(() => { globalOrchestrationClient.setPlaybackOffset(offset); });
  yield put(setDevicePlaybackOffset(offset));
}

function* sendMessage({ message }) {
  yield call(() => { globalOrchestrationClient.sendMessage(message); });
}

export const orchestrationWatcherSaga = function* orchestrationWatcherSaga() {
  // Player and orchestration controls
  yield takeEvery('REQUEST_PLAY', play);
  yield takeEvery('REQUEST_PAUSE', pause);
  yield takeEvery('REQUEST_SEEK', seek);
  // yield takeEvery('REQUEST_SET_VOLUME', ...);
  yield takeEvery('REQUEST_MUTE_LOCAL', mute);
  yield takeEvery('REQUEST_UNMUTE_LOCAL', unmute);
  yield takeEvery('REQUEST_SET_CONTROL_VALUES', setDeviceControls);
  yield takeEvery('REQUEST_TRANSITION_TO_SEQUENCE', transitionToSequence);
  yield takeEvery('REQUEST_SET_GAIN', setGain);
  yield takeEvery('REQUEST_SET_PLAYBACK_OFFSET', setPlaybackOffset);
  yield takeEvery('REQUEST_COMPRESSOR_SETTINGS', function* setCompressorSettings(action) {
    yield call(() => globalOrchestrationClient.setCompressorRatio(action.ratio));
    yield call(() => globalOrchestrationClient.setCompressorThreshold(action.threshold));
  });
  yield takeEvery('REQUEST_SEND_MESSAGE', sendMessage);
};
