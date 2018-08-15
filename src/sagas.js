import {
  takeEvery,
  take,
  call,
  put,
} from 'redux-saga/effects';

import {
  initialiseOrchestration,
  play,
  pause,
  mute,
  seek,
  playAgain,
  setDeviceLocation,
} from './template/actions/orchestration';

const PAGE_START = 'start';
const PAGE_LOADING = 'loading';
const PAGE_ERROR = 'error';
const PAGE_MASTER_SETUP = 'master-setup';
const PAGE_MASTER_PLAYING = 'master-playing';
const PAGE_CONNECT_FORM = 'connect-form';
const PAGE_CONNECT_DIRECT = 'connect-direct';
const PAGE_SLAVE_SETUP_LOCATION = 'slave-setup-location';
const PAGE_SLAVE_PLAYING = 'slave-playing';
const PAGE_SLAVE_PLAYING_LOCATION = 'slave-playing-location';

const ROLE_MASTER = 'master';
const ROLE_SLAVE = 'slave';

function* validateSessionCode(action) {
  try {
    yield put({ type: 'VALIDATING_SESSION_CODE' });

    const { sessionId, sessionCode, valid } = yield call(getSessionId, action.sessionCode);

    if (!valid) {
      throw new Error('SessionCode invalid.');
    }

    yield put({ type: 'VALID_SESSION_CODE', sessionCode, sessionId });
  } catch (e) {
    yield put({ type: 'INVALID_SESSION_CODE' });
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
    yield call(initialiseOrchestration, true, {});
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
function* slaveFlow(sessionId) {
  yield put({ type: 'SET_ROLE', role: ROLE_SLAVE });
  yield put({ type: 'SET_PAGE', page: PAGE_LOADING });

  try {
    yield call(initialiseOrchestration, false, { joinSessionId: sessionId });
  } catch (e) {
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
  const { sessionId } = yield call(connectForm);
  yield call(slaveFlow, sessionId);
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
    yield call(slaveFlow, sessionId);
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

  // Player and orchestration controls
  yield takeEvery('REQUEST_PLAY', play);
  yield takeEvery('REQUEST_PAUSE', pause);
  yield takeEvery('REQUEST_SEEK', seek);
  yield takeEvery('REQUEST_PLAY_AGAIN', playAgain);
  // yield takeEvery('REQUEST_SET_VOLUME', ...);
  yield takeEvery('REQUEST_MUTE_LOCAL', mute);
  yield takeEvery('REQUEST_CHANGE_LOCATION', setDeviceLocation);
}

function* rootSaga() {
  yield call(watcherSaga);
  yield call(startFlow);
}

export default rootSaga;
