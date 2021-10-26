/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/* eslint no-use-before-define: ["error", { "functions": false }] */
import {
  takeEvery,
  take,
  call,
  put,
  fork,
} from 'redux-saga/effects';

import NoSleep from 'nosleep.js';
import bowser from 'bowser';

import config from 'config';
import { orchestrationWatcherSaga, connectOrchestration } from './template/orchestration';
import { GLOBAL_CALIBRATION_STATES, calibrationWatcherSaga } from './template/calibrationOrchestration';
import { createSession, validateSession } from './session';

export const PAGE_START = 'start';
export const PAGE_LOADING = 'loading';
export const PAGE_INSTRUCTIONS = 'instructions';
export const PAGE_ERROR = 'error';
export const PAGE_PLAYING = 'main-playing';
export const PAGE_CONNECT_FORM = 'connect-form';
export const PAGE_CONNECT_DIRECT = 'connect-direct';
export const PAGE_CALIBRATION = 'calibration';

export const ROLE_MAIN = 'main';
export const ROLE_AUXILIARY = 'auxiliary';

const noSleep = new NoSleep();
const browser = bowser.parse(window.navigator.userAgent);
// Firefox mobile browsers seem to have issues with noSleep so it is not activated on those browsers
const isMobile = ['mobile', 'tablet'].includes(browser.platform.type) && browser.engine.name !== 'Gecko';

export const acquireWakeLock = () => {
  if (isMobile && config.ENABLE_WAKE_LOCK) noSleep.enable();
};

function getInitialControlValues() {
  // set control default values from config, must be after orchestrationWatcherSaga is running
  // because it also listens for these actions
  const initialControlValues = {};
  config.CONTROLS.forEach(({ controlId, controlDefaultValues = [] }) => {
    initialControlValues[controlId] = [...controlDefaultValues];
  });

  return initialControlValues;
}

function* validateSessionCode(action) {
  try {
    yield put({ type: 'SESSION_CODE_VALIDATING' });

    const { sessionId, sessionCode, valid } = yield call(validateSession, action.sessionCode);

    if (!valid) {
      throw new Error('SessionCode invalid.');
    }

    yield put({ type: 'SESSION_CODE_VALID', sessionCode, sessionId });
  } catch (e) {
    yield put({ type: 'SESSION_CODE_INVALID' });
  }
}

/**
 * Opens the session code entry form.
 *
 * @param {boolean} canCancel - whether the cancel button should be dislayed with the form.
 *
 * @returns {Object} ret
 * @returns {boolean} ret.cancelled - true if user cancelled.
 * @returns {string} ret.sessionCode - validated sessionCode
 * @returns {string} ret.sessionId - validated sessionId
 */
function* connectForm(canCancel = true) {
  yield put({ type: 'SET_CONNECT_FORM_CAN_CANCEL', canCancel });
  yield put({ type: 'SET_PAGE', page: PAGE_CONNECT_FORM });

  // wait for a session code valid action (user presses button, and validation is positive)
  const action = yield take(['SESSION_CODE_VALID', 'CLOSE_CONNECT_FORM']);

  if (action.type === 'CLOSE_CONNECT_FORM') {
    return { cancelled: true };
  }

  const { sessionCode, sessionId } = action;
  return { sessionCode, sessionId };
}

/**
 * Main flow for the main device.
 *
 * After deciding the device is the main, we try to create a session. Then the playing screen is
 * shown. Sequence transitions are dispatched by the page component or the orchestration saga.
 * We don't open the controls page automatically, but it is available on the main device too.
 */
function* mainFlow() {
  yield put({ type: 'SET_ROLE', role: ROLE_MAIN });

  yield put({ type: 'SET_PAGE', page: PAGE_LOADING });

  yield takeEvery('SET_ERROR', function* openErrorPage() {
    yield put({ type: 'SET_PAGE', page: PAGE_ERROR });
  });

  try {
    const { sessionId, sessionCode } = yield call(createSession);
    yield put({ type: 'SET_SESSION_CODE', sessionCode, sessionId });
    yield call(connectOrchestration, true, sessionId);
  } catch (e) {
    let errorMessage = `${e}`;
    if (!errorMessage || errorMessage.includes('undefined')) {
      errorMessage = 'Could not connect to the synchronisation server, please make sure you have a working internet connection.';
    }

    yield put({
      type: 'SET_ERROR',
      errorMessage,
      errorShowRetry: true,
    });
    yield take('CLICK_ERROR_RETRY');
    window.location.reload();
    return;
  }

  // Now we are connected we can set the initial control values (because they need to be sent to
  // the main device).
  yield put({ type: 'REQUEST_SET_CONTROL_VALUES', controlValues: getInitialControlValues() });

  // once loading is completed, accept the continue action before moving to the playing page.
  if (config.ENABLE_TUTORIAL) {
    yield take('CLICK_TUTORIAL_CONTINUE');
  }

  // Open the playing page, and move between the controls and playing pages on further actions.
  yield put({ type: 'SET_PAGE', page: PAGE_PLAYING });
}

/**
 * Main flow for a auxiliary device.
 *
 * After having decided that this device is a auxiliary, a session code is requested from the user.
 * If this succeeds, we move on to the controls screen and then the playing screen.
 */
function* auxiliaryFlow({ sessionCode, sessionId }) {
  yield put({ type: 'SET_SESSION_CODE', sessionCode, sessionId });
  yield put({ type: 'SET_ROLE', role: ROLE_AUXILIARY });

  yield put({ type: 'SET_PAGE', page: PAGE_LOADING });

  yield takeEvery('SET_ERROR', function* openErrorPage() {
    yield put({ type: 'SET_PAGE', page: PAGE_ERROR });
  });

  yield takeEvery('SET_DISCONNECTED', function* openAuxDisconnectedPage() {
    yield put({
      type: 'SET_ERROR',
      errorMessage: 'The connection to the main device has been lost.',
      errorShowRetry: false,
    });
  });

  try {
    yield call(connectOrchestration, false, sessionId);
  } catch (e) {
    console.error(e);
    let errorMessage = `${e}`;
    if (errorMessage.includes('undefined')) {
      errorMessage = 'Could not connect to the synchronisation server, please make sure you have a working internet connection.';
    }

    yield put({
      type: 'SET_ERROR',
      errorMessage,
      errorShowRetry: true,
    });
    yield take('CLICK_ERROR_RETRY');
    window.location.hash = '#!/join';
    window.location.reload();
    return;
  }

  // Now we are connected we can set the initial control values (because they need to be sent to
  // the main device).
  yield put({ type: 'REQUEST_SET_CONTROL_VALUES', controlValues: getInitialControlValues() });

  // once loading is completed, accept the continue action before moving to the playing page.
  if (config.ENABLE_TUTORIAL) {
    yield take('CLICK_TUTORIAL_CONTINUE');
  }

  // Open the playing page.
  yield put({ type: 'SET_PAGE', page: PAGE_PLAYING });
}

/**
 * Entry point for /join, go directly to the form to enter a session code.
 */
function* joinFlow() {
  const { cancelled, sessionCode, sessionId } = yield call(connectForm);

  if (cancelled) {
    yield call(startFlow);
  } else {
    yield call(auxiliaryFlow, { sessionCode, sessionId });
  }
}

/**
 * Entry point for /join/session-code, only have to click a button to join
 * the pre-filled session code.
 */
function* directJoinFlow(sessionCodeParam) {
  const { sessionCode } = sessionCodeParam;
  yield put({ type: 'SET_PAGE', page: PAGE_CONNECT_DIRECT });
  yield take('CLICK_JOIN_DIRECT');
  yield put({ type: 'REQUEST_VALIDATE_SESSION_CODE', sessionCode });

  const result = yield take(['SESSION_CODE_VALID', 'SESSION_CODE_INVALID']);

  if (result.type === 'SESSION_CODE_VALID') {
    const { sessionId } = result;
    yield call(auxiliaryFlow, { sessionCode, sessionId });
  } else {
    yield call(joinFlow);
  }
}

/**
 * Entry point for /, give the user the option to create or join a session.
 */
function* startFlow() {
  yield put({ type: 'SET_PAGE', page: PAGE_START });

  const action = yield take(['CLICK_CREATE_SESSION', 'CLICK_JOIN_SESSION']);

  if (action.type === 'CLICK_CREATE_SESSION') {
    yield call(mainFlow);
  } else {
    yield call(joinFlow);
  }
}

/**
 * Listens for user actions that could happen at any time, and not just once as part of a specific
 * screen.
 */
function* watcherSaga() {
  // In the connection form, the connect button dispatches this action:
  yield takeEvery('REQUEST_VALIDATE_SESSION_CODE', validateSessionCode);

  // listen for open/close actions for instructions page
  yield takeEvery('CLICK_OPEN_INSTRUCTIONS', function* openInstructionsPage() {
    yield put({ type: 'SET_PAGE', page: PAGE_INSTRUCTIONS });
  });

  yield takeEvery('CLICK_CLOSE_INSTRUCTIONS', function* closeInstructionsPage() {
    yield put({ type: 'SET_PAGE', page: PAGE_PLAYING });
  });

  yield takeEvery('SET_GLOBAL_CALIBRATION_STATE', function* toggleCalibrationPage({ globalCalibrationState }) {
    if (globalCalibrationState === GLOBAL_CALIBRATION_STATES.CALIBRATION_MODE
      || globalCalibrationState === GLOBAL_CALIBRATION_STATES.ONGOING) {
      yield put({ type: 'SET_PAGE', page: PAGE_CALIBRATION });
    } else {
      yield put({ type: 'SET_PAGE', page: PAGE_PLAYING });
    }
  });

  yield takeEvery('SET_PAGE', function* releaseWakeLockOnError({ page }) {
    yield call(() => { if (page === PAGE_ERROR) noSleep.disable(); });
  });
}

function* rootSaga({
  join = false,
  sessionCode = null,
  deviceId,
} = {}) {
  if (!config.CLOUDSYNC_ENDPOINT) {
    yield put({ type: 'SET_ERROR', errorMessage: 'To use this template you must first configure a synchronisation server by setting the CLOUDSYNC_CLIENT option in index.html.' });
    return;
  }

  yield put({ type: 'SET_DEVICE_ID', deviceId });
  yield fork(watcherSaga);
  yield fork(orchestrationWatcherSaga);
  yield fork(calibrationWatcherSaga);

  if (join && sessionCode !== null) {
    yield call(directJoinFlow, { sessionCode });
  } else if (join) {
    yield call(joinFlow);
  } else {
    yield call(startFlow);
  }
}

export default rootSaga;
