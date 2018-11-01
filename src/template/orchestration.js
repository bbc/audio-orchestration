import bowser from 'bowser';
import { takeEvery, call } from 'redux-saga/effects';
import OrchestrationClient from 'bbcat-orchestration/src/orchestration/orchestration-client';
import {
  addLoadingMessage,
  setConnected,
  setDisconnected,
  setEnded,
  setErrorMessage,
  setPrimaryObject,
  setActiveObjectIds,
  setMuted,
  setTransportCapabilities,
  setConnectedDevices,
  setPlaybackStatus,
} from './actions/orchestration';
import {
  SEQUENCE_URLS,
  PLAY_AGAIN_CONTENT_ID,
  MDO_COMPRESSOR_RATIO,
  MDO_COMPRESSOR_THRESHOLD,
  CLOUDSYNC_ENDPOINT,
  SEQUENCE_TRANSITION_DELAY,
  LOADING_TIMEOUT,
  CONTENT_ID,
} from '../config';

// A global browser detection object
const browser = bowser.getParser(window.navigator.userAgent);

// A global reference to the audio context. It has to be created on a user action and then passed
// into OrchestrationClient.start().
let globalAudioContext = null;

// A global orchestration object - this is the only instance of it. It is started with a sessionId,
// deviceId, and audioContext reference in connectOrchestration.
const globalOrchestrationClient = new OrchestrationClient({
  cloudSyncEndpoint: CLOUDSYNC_ENDPOINT,
  sequenceTransitionDelay: SEQUENCE_TRANSITION_DELAY,
  loadingTimeout: LOADING_TIMEOUT,
  contentId: CONTENT_ID,
});

/**
 * Ensure an audio context exists.
 */
export const ensureAudioContext = () => {
  if (globalAudioContext !== null) {
    globalAudioContext.resume();
  } else {
    globalAudioContext = OrchestrationClient.createAudioContext();
  }
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
export const initialiseOrchestration = (dispatch) => {
  SEQUENCE_URLS.forEach(({ contentId, url }) => {
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
      canSeek: globalOrchestrationClient.master && !e.loop,
      canPause: globalOrchestrationClient.master,
    }));
  });

  globalOrchestrationClient.on('devices', (e) => {
    dispatch(setConnectedDevices(e));
  });

  globalOrchestrationClient.on('objects', (e) => {
    dispatch(setActiveObjectIds(e.activeObjectIds));
    dispatch(setPrimaryObject(e.primaryObjectId, e.primaryObjectImage));
  });

  globalOrchestrationClient.on('mute', muted => dispatch(setMuted(muted)));

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
    globalOrchestrationClient.setDeviceType(browser.getPlatform().type);
  });

  return globalOrchestrationClient.deviceId;
};

export const connectOrchestration = (master, sessionId) => globalOrchestrationClient.start(
  master,
  sessionId,
  globalAudioContext,
)
  .then(() => {
    if (!master) {
      globalOrchestrationClient.setCompressorRatio(MDO_COMPRESSOR_RATIO);
      globalOrchestrationClient.setCompressorThreshold(MDO_COMPRESSOR_THRESHOLD);
    }
  })
  .then(() => ({ success: true }))
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

function* playAgain() {
  yield call(() => globalOrchestrationClient.transitionToSequence(PLAY_AGAIN_CONTENT_ID));
}

function* setDeviceLocation({ location }) {
  yield call(() => globalOrchestrationClient.setDeviceLocation(location));
}

export const orchestrationWatcherSaga = function* () {
  // Player and orchestration controls
  yield takeEvery('REQUEST_PLAY', play);
  yield takeEvery('REQUEST_PAUSE', pause);
  yield takeEvery('REQUEST_SEEK', seek);
  yield takeEvery('REQUEST_PLAY_AGAIN', playAgain);
  // yield takeEvery('REQUEST_SET_VOLUME', ...);
  yield takeEvery('REQUEST_MUTE_LOCAL', mute);
  yield takeEvery('REQUEST_UNMUTE_LOCAL', unmute);
  yield takeEvery('REQUEST_SET_DEVICE_LOCATION', setDeviceLocation);
  yield takeEvery('REQUEST_TRANSITION_TO_SEQUENCE', transitionToSequence);

  yield takeEvery('REQUEST_COMPRESSOR_SETTINGS', function* (action) {
    yield call(() => globalOrchestrationClient.setCompressorRatio(action.ratio));
    yield call(() => globalOrchestrationClient.setCompressorThreshold(action.threshold));
  });
};
