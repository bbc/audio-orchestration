import { takeEvery, call } from 'redux-saga/effects';
import OrchestrationClient from 'bbcat-orchestration/src/orchestration/orchestration-client';
import {
  setLoadingMessage,
  setConnected,
  setEnded,
  setErrorMessage,
  setPrimaryObject,
  setActiveObjectIds,
  setMuted,
  setTransportCapabilities,
  setConnectedDevices,
  setPlaybackStatus,
  setSessionCode,
} from './actions/orchestration';
import {
  SEQUENCE_URLS,
  PLAY_AGAIN_CONTENT_ID,
  MDO_COMPRESSOR_RATIO,
  MDO_COMPRESSOR_THRESHOLD,
} from '../config';

// global orchestration object - this is the only instance of it.
const globalOrchestrationClient = new OrchestrationClient({});

/**
 * Initialise the orchestration object by registering the sequences to load and setting up
 * event handlers. The event handlers dispatch actions that expose the orchestration state to the
 * user interface, via the redux state.
 *
 * @param {function} dispatch - the redux store's dispatch method.
 */
export const initialiseOrchestration = (dispatch) => {
  SEQUENCE_URLS.forEach(({ contentId, url }) => {
    globalOrchestrationClient.registerSequence(contentId, url);
  });

  globalOrchestrationClient.on('loading', (message) => {
    if (message !== false) {
      dispatch(setLoadingMessage(message));
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
    dispatch(setPrimaryObject(e.primaryObjectId, e.primaryObjectImageUrl));
  });

  globalOrchestrationClient.on('mute', muted => dispatch(setMuted(muted)));

  globalOrchestrationClient.on('connected', () => dispatch(setConnected(true)));

  globalOrchestrationClient.on('disconnected', () => {
    dispatch(setErrorMessage('Disconnected.'));
  });

  globalOrchestrationClient.on('unavailable', () => {
    dispatch(setErrorMessage('Synchronised clock has become unavailable.'));
  });

  globalOrchestrationClient.on('error', (e) => {
    dispatch(setErrorMessage(e.message));
  });

  globalOrchestrationClient.on('ended', (ended) => {
    dispatch(setEnded(ended));
  });
};

export const connectOrchestration = (master, sessionId) => {
  console.debug('connectOrchestration', sessionId);
  return globalOrchestrationClient.start(master, sessionId)
    .then(() => {
      if (!master) {
        globalOrchestrationClient.setCompressorRatio(MDO_COMPRESSOR_RATIO);
        globalOrchestrationClient.setCompressorThreshold(MDO_COMPRESSOR_THRESHOLD);
      }
    })
    .then(() => ({ success: true }))
    .catch((e) => {
      console.error('connectOrchestration error:', e);
      throw e;
    });
};

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
