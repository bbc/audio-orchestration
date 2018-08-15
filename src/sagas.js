/*eslint no-use-before-define: ["error", { "functions": false }]*/
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
export const PAGE_MASTER_SETUP = 'master-setup';
export const PAGE_MASTER_PLAYING = 'master-playing';
export const PAGE_CONNECT_FORM = 'connect-form';
export const PAGE_CONNECT_DIRECT = 'connect-direct';
export const PAGE_SLAVE_SETUP_LOCATION = 'slave-setup-location';
export const PAGE_SLAVE_PLAYING = 'slave-playing';
export const PAGE_SLAVE_PLAYING_LOCATION = 'slave-playing-location';

export const ROLE_MASTER = 'master';
export const ROLE_SLAVE = 'slave';

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
function* connectForm(canCancel = false) {
  yield put({ type: 'SET_CONNECT_FORM_CAN_CANCEL', canCancel });
  yield put({ type: 'SET_PAGE', page: PAGE_CONNECT_FORM });

  // wait for a session code valid action (user presses button, and validation is positive)
  const action = yield take(['SESSION_CODE_VALID', 'CLOSE_CONNECT_FORM']);

  if (action === 'CLOSE_CONNECT_FORM') {
    return { cancelled: true };
  }

  const { sessionCode, sessionId } = action;
  return { sessionCode, sessionId };
}

/**
 * Main flow for the master device.
 *
 * After deciding the device is the master, we try to create a session. Then the setup screen is
 * shown, before moving on to the main playing screen.
 */
function* masterFlow() {
  yield put({ type: 'SET_ROLE', role: ROLE_MASTER });
  yield put({ type: 'SET_PAGE', page: PAGE_LOADING });

  try {
    const { sessionId, sessionCode } = yield call(createSession);
    yield put({ type: 'SET_SESSION_CODE', sessionCode });
    yield call(connectOrchestration, true, sessionId);
  } catch (e) {
    yield put({ type: 'SET_PAGE', page: PAGE_ERROR });
    yield take('CLICK_ERROR_RETRY');
    window.location.reload(); // TODO okay to do that here?
    return;
  }

  yield put({ type: 'SET_PAGE', page: PAGE_MASTER_SETUP });

  yield take('CLICK_MASTER_SETUP_CONTINUE');

  yield put({ type: 'SET_PAGE', page: PAGE_MASTER_PLAYING });
}

/**
 * Main flow for a slave device.
 *
 * After having decided that this device is a slave, a session code is requested from the user.
 * If this succeeds, we move on to the location screen and then the playing screen.
 */
function* slaveFlow({ sessionCode, sessionId }) {
  yield put({ type: 'SET_SESSION_CODE', sessionCode });
  yield put({ type: 'SET_ROLE', role: ROLE_SLAVE });
  yield put({ type: 'SET_PAGE', page: PAGE_LOADING });

  try {
    yield call(connectOrchestration, false, sessionId);
  } catch (e) {
    yield put({ type: 'SET_ERROR', errorMessage: e.message });
    yield put({ type: 'SET_PAGE', page: PAGE_ERROR });
    yield take('CLICK_ERROR_RETRY');
    yield call(joinFlow);
    return;
  }

  yield put({ type: 'SET_PAGE', page: PAGE_SLAVE_SETUP_LOCATION });

  while (true) {
    yield take('REQUEST_CLOSE_SLAVE_LOCATION');
    yield put({ type: 'SET_PAGE', page: PAGE_SLAVE_PLAYING });
    yield take('REQUEST_OPEN_SLAVE_LOCATION');
    yield put({ type: 'SET_PAGE', page: PAGE_SLAVE_PLAYING_LOCATION });
  }
}

/**
 * Entry point for /join, go directly to the form to enter a session code.
 */
function* joinFlow() {
  const { sessionCode, sessionId } = yield call(connectForm);
  yield call(slaveFlow, { sessionCode, sessionId });
}

/**
 * Entry point for /join/session-code, only have to click a button to join
 * the pre-filled session code.
 */
function* directJoinFlow(sessionCode) {
  yield put({ type: 'SET_PAGE', page: PAGE_CONNECT_DIRECT });
  yield take('CLICK_JOIN');
  yield put({ type: 'REQUEST_VALIDATE_SESSION_CODE', sessionCode });

  const result = yield take(['SESSION_CODE_VALID', 'SESSION_CODE_INVALID']);

  if (result.type === 'SESSION_CODE_VALID') {
    const { sessionId } = result;
    yield call(slaveFlow, { sessionId, sessionCode });
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
    yield call(masterFlow);
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

  // TODO: listen for disconnected event and show error page and stop audio.
  // TODO: listen for ended event (somewhere)
}

function* rootSaga(join = false, sessionCode = null) {
  yield fork(watcherSaga);
  yield fork(orchestrationWatcherSaga);

  if (join && sessionCode !== null) {
    yield call(directJoinFlow);
  } else if (join) {
    yield call(joinFlow);
  } else {
    yield call(startFlow);
  }
}

export default rootSaga;
