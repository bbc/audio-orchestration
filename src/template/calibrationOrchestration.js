import { OrchestrationClient } from '@bbc/bbcat-orchestration';
import {
  takeEvery,
  call,
  select,
  put,
} from 'redux-saga/effects';
import { v4 as uuidv4 } from 'uuid';
import config from 'config';
import {
  setLocalCalibrationState,
  setGlobalCalibrationState,
  requestPlay,
  requestPause,
  requestSendMessage,
} from './actions/orchestration';

let dispatch = () => {};
let ensureAudioContext = null;
let isSafari = false;
let isMain = false;
let deviceId = null;

let calibrationOrchestrationClient = null;

let playingBeforeCalibrationMode = false;

let currentCalibrationTargetDeviceId = null;

export const LOCAL_CALIBRATION_STATES = {
  DISCONNECTED: 'disconnected',
  LOADING: 'loading',
  ERROR: 'error',
  CONNECTED: 'connected',
};

export const GLOBAL_CALIBRATION_STATES = {
  AVAILABLE: 'available',
  ONGOING: 'ongoing',
  CALIBRATION_MODE: 'calibration-mode',
};

const MESSAGE_TYPES = {
  ENTER_CALIBRATION_MODE: 'enter-calibration-mode',
  EXIT_CALIBRATION_MODE: 'exit-calibration-mode',
  REQUEST_CALIBRATION_SESSION: 'request-calibration-session',
  START_CALIBRATION_SESSION: 'start-calibration-session',
  END_CALIBRATION_SESSION: 'end-calibration-session',
  SET_GLOBAL_CALIBRATION_STATE: 'set-global-calibration-state',
};

let globalCalibrationState = GLOBAL_CALIBRATION_STATES.AVAILABLE;

export const initialiseCalibrationOrchestration = (options) => {
  dispatch = options.dispatch;
  ensureAudioContext = options.ensureAudioContext;
  isSafari = options.isSafari;
  isMain = options.isMain;
  deviceId = options.deviceId;
};

const updateGlobalCalibrationState = (calibrationState) => {
  globalCalibrationState = calibrationState;
  dispatch(setGlobalCalibrationState(calibrationState));
  dispatch(requestSendMessage({
    type: MESSAGE_TYPES.SET_GLOBAL_CALIBRATION_STATE,
    globalCalibrationState,
  }));
};

const handleLoaded = () => {
  calibrationOrchestrationClient.setDeviceMetadata({
    deviceControls: [{
      controlId: 'type',
      controlValues: [isMain ? 'reference' : 'target'],
    }],
  });
  dispatch(setLocalCalibrationState(LOCAL_CALIBRATION_STATES.CONNECTED));
  // if (calibrationOrchestrationClient.isMain) calibrationOrchestrationClient.play();
};

export const endCalibrationClient = () => {
  if (calibrationOrchestrationClient) {
    calibrationOrchestrationClient.removeAllListeners();
    calibrationOrchestrationClient.destroy();
    calibrationOrchestrationClient = null;
  }
  dispatch(setLocalCalibrationState(LOCAL_CALIBRATION_STATES.DISCONNECTED));
};

const handleError = (e) => {
  endCalibrationClient();
  console.error('connectCalibrationOrchestration error:', e);
  dispatch(setLocalCalibrationState(LOCAL_CALIBRATION_STATES.ERROR));
};

export const startCalibrationClient = (sessionId) => {
  endCalibrationClient();

  dispatch(setLocalCalibrationState(LOCAL_CALIBRATION_STATES.LOADING));

  calibrationOrchestrationClient = new OrchestrationClient({
    cloudSyncEndpoint: config.CLOUDSYNC_ENDPOINT,
    sequenceTransitionDelay: config.CALIBRATION_SEQUENCE_TRANSITION_DELAY,
    loadingTimeout: config.CALIBRATION_LOADING_TIMEOUT,
    contentId: config.SYNC_CLOCK_CONTENT_ID,
    isStereo: config.ENABLE_STEREO_ON_AUX_DEVICES,
    isSafari,
  });

  calibrationOrchestrationClient.on('loaded', handleLoaded);

  calibrationOrchestrationClient.on('error', handleError);

  calibrationOrchestrationClient.registerSequence(
    'bbcat-orchestration-template:calibration',
    config.CALIBRATION_SEQUENCE_URL,
  );

  calibrationOrchestrationClient.start(
    isMain,
    sessionId,
    ensureAudioContext(),
  ).catch(handleError);
};

const setPlaybackOffset = ({ offset }) => {
  calibrationOrchestrationClient.setPlaybackOffset(offset);
};

function* onApplicationError() {
  yield call(() => { endCalibrationClient(); });
}

function* requestStartCalibrationSession() {
  yield put((requestSendMessage({
    type: MESSAGE_TYPES.REQUEST_CALIBRATION_SESSION,
    targetDeviceId: deviceId,
  })));
}

function* requestEndCalibrationSession() {
  endCalibrationClient();
  yield put(requestSendMessage({ type: MESSAGE_TYPES.END_CALIBRATION_SESSION }));
  if (isMain) {
    currentCalibrationTargetDeviceId = null;
    updateGlobalCalibrationState(GLOBAL_CALIBRATION_STATES.CALIBRATION_MODE);
  }
}

function* handleDeviceChange({ connectedDevices }) {
  if (!isMain) return;
  // Check for calibration device drop-out
  if (currentCalibrationTargetDeviceId
      && !connectedDevices.some((device) => device.deviceId === currentCalibrationTargetDeviceId)) {
    currentCalibrationTargetDeviceId = null;
    endCalibrationClient();
    updateGlobalCalibrationState(GLOBAL_CALIBRATION_STATES.CALIBRATION_MODE);
  }
  // Notify new devices of current calibration status
  yield put(requestSendMessage({
    type: MESSAGE_TYPES.SET_GLOBAL_CALIBRATION_STATE,
    globalCalibrationState,
  }));
}

function* enterCalibrationMode() {
  playingBeforeCalibrationMode = yield select((state) => state.playing);
  if (playingBeforeCalibrationMode) yield put(requestPause());
  yield call(() => { updateGlobalCalibrationState(GLOBAL_CALIBRATION_STATES.CALIBRATION_MODE); });
}

function* exitCalibrationMode() {
  if (playingBeforeCalibrationMode) yield put(requestPlay());
  yield call(() => { updateGlobalCalibrationState(GLOBAL_CALIBRATION_STATES.AVAILABLE); });
}

function* toggleCalibrationMode({ calibrationMode }) {
  if (isMain) yield call(calibrationMode ? enterCalibrationMode : exitCalibrationMode);
  else {
    yield put(requestSendMessage({
      type: calibrationMode
        ? MESSAGE_TYPES.ENTER_CALIBRATION_MODE
        : MESSAGE_TYPES.EXIT_CALIBRATION_MODE,
    }));
  }
}

function* handleRequestStartCalibrationSession(targetDeviceId) {
  if (!currentCalibrationTargetDeviceId) {
    currentCalibrationTargetDeviceId = targetDeviceId;
    updateGlobalCalibrationState(GLOBAL_CALIBRATION_STATES.ONGOING);
    const sessionId = `bbact-orchestration-calibration-${uuidv4()}`;
    yield put(requestSendMessage({
      type: MESSAGE_TYPES.START_CALIBRATION_SESSION,
      targetDeviceId,
      sessionId,
    }));
    startCalibrationClient(sessionId);
  }
}

function endCalibrationSession() {
  endCalibrationClient();
  if (isMain) {
    updateGlobalCalibrationState(GLOBAL_CALIBRATION_STATES.CALIBRATION_MODE);
    currentCalibrationTargetDeviceId = null;
  }
}

function* handleMessage({ message }) {
  switch (message.type) {
    case MESSAGE_TYPES.ENTER_CALIBRATION_MODE:
      if (isMain) yield call(enterCalibrationMode);
      break;
    case MESSAGE_TYPES.EXIT_CALIBRATION_MODE:
      if (isMain) yield call(exitCalibrationMode);
      break;
    case MESSAGE_TYPES.REQUEST_CALIBRATION_SESSION:
      if (isMain) yield call(handleRequestStartCalibrationSession, message.targetDeviceId);
      break;
    case MESSAGE_TYPES.END_CALIBRATION_SESSION:
      yield call(endCalibrationSession);
      break;
    case MESSAGE_TYPES.SET_GLOBAL_CALIBRATION_STATE:
      globalCalibrationState = message.globalCalibrationState;
      yield put(setGlobalCalibrationState(message.globalCalibrationState));
      break;
    case MESSAGE_TYPES.START_CALIBRATION_SESSION:
      if (message.targetDeviceId === deviceId) startCalibrationClient(message.sessionId);
      break;
    default:
  }
}

export const calibrationWatcherSaga = function* calibrationWatcherSaga() {
  yield takeEvery('REQUEST_CALIBRATION_SET_PLAYBACK_OFFSET', setPlaybackOffset);
  yield takeEvery('SET_ERROR', onApplicationError);
  yield takeEvery('SET_DISCONNECTED', onApplicationError);
  yield takeEvery('REQUEST_CALIBRATION_MODE', toggleCalibrationMode);
  yield takeEvery('REQUEST_START_CALIBRATION_SESSION', requestStartCalibrationSession);
  yield takeEvery('REQUEST_END_CALIBRATION_SESSION', requestEndCalibrationSession);
  yield takeEvery('SET_ALLOCATIONS_AND_DEVICES', handleDeviceChange);
  yield takeEvery('RECEIVED_CALIBRATION_MESSAGE', handleMessage);
};
