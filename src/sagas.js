/* eslint no-use-before-define: ["error", { "functions": false }] */
import {
  takeEvery,
  take,
  call,
  put,
  fork,
} from 'redux-saga/effects';

import { orchestrationWatcherSaga, connectOrchestration } from './template/orchestration';
import { createSession, validateSession } from './session';

export const PAGE_START = 'start';
export const PAGE_LOADING = 'loading';
export const PAGE_ERROR = 'error';
export const PAGE_MAIN_SETUP = 'main-setup';
export const PAGE_MAIN_PLAYING = 'main-playing';
export const PAGE_CONNECT_FORM = 'connect-form';
export const PAGE_CONNECT_DIRECT = 'connect-direct';
export const PAGE_AUXILIARY_SETUP_TAG = 'auxiliary-setup-tag';
export const PAGE_AUXILIARY_PLAYING = 'auxiliary-playing';
export const PAGE_AUXILIARY_PLAYING_TAG = 'auxiliary-playing-tag';
export const PAGE_AUXILIARY_DISCONNECTED = 'auxiliary-disconnected';

export const ROLE_MAIN = 'main';
export const ROLE_AUXILIARY = 'auxiliary';

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
 */
function* mainFlow() {
  yield put({ type: 'SET_ROLE', role: ROLE_MAIN });
  yield put({ type: 'SET_PAGE', page: PAGE_LOADING });

  yield takeEvery('SET_ERROR', function* () {
    yield put({ type: 'SET_PAGE', page: PAGE_ERROR });
  });

  try {
    const { sessionId, sessionCode } = yield call(createSession);
    yield put({ type: 'SET_SESSION_CODE', sessionCode, sessionId });
    yield call(connectOrchestration, true, sessionId);
  } catch (e) {
    console.error(e);
    yield put({ type: 'SET_ERROR', errorMessage: e.message });
    yield take('CLICK_ERROR_RETRY');
    window.location.reload(); // TODO okay to do that here?
    return;
  }

  yield put({ type: 'SET_PAGE', page: PAGE_MAIN_PLAYING });
}

/**
 * Main flow for a auxiliary device.
 *
 * After having decided that this device is a auxiliary, a session code is requested from the user.
 * If this succeeds, we move on to the tag screen and then the playing screen.
 */
function* auxiliaryFlow({ sessionCode, sessionId }) {
  yield put({ type: 'SET_SESSION_CODE', sessionCode, sessionId });
  yield put({ type: 'SET_ROLE', role: ROLE_AUXILIARY });
  yield put({ type: 'SET_PAGE', page: PAGE_LOADING });

  yield takeEvery('SET_ERROR', function* () {
    yield put({ type: 'SET_PAGE', page: PAGE_ERROR });
  });

  yield takeEvery('SET_DISCONNECTED', function* () {
    yield put({ type: 'SET_PAGE', page: PAGE_AUXILIARY_DISCONNECTED });
  });

  try {
    yield call(connectOrchestration, false, sessionId);
  } catch (e) {
    console.error(e);
    yield put({ type: 'SET_ERROR', errorMessage: e.message });
    yield take('CLICK_ERROR_RETRY');
    yield call(joinFlow);
    return;
  }

  yield put({ type: 'SET_PAGE', page: PAGE_AUXILIARY_SETUP_TAG });

  while (true) {
    yield take('REQUEST_CLOSE_AUXILIARY_TAG');
    yield put({ type: 'SET_PAGE', page: PAGE_AUXILIARY_PLAYING });
    yield take('REQUEST_OPEN_AUXILIARY_TAG');
    yield put({ type: 'SET_PAGE', page: PAGE_AUXILIARY_PLAYING_TAG });
  }
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
}

function* rootSaga({
  join = false,
  sessionCode = null,
  deviceId,
} = {}) {
  yield put({ type: 'SET_DEVICE_ID', deviceId });
  yield fork(watcherSaga);
  yield fork(orchestrationWatcherSaga);

  if (join && sessionCode !== null) {
    yield call(directJoinFlow, { sessionCode });
  } else if (join) {
    yield call(joinFlow);
  } else {
    yield call(startFlow);
  }
}

export default rootSaga;
