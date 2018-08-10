import OrchestrationClient from 'bbcat-orchestration/src/orchestration/orchestration-client';

import {
  SESSION_CODE_LENGTH,
  INITIAL_CONTENT_ID,
  SEQUENCE_URLS,
} from '../../config';

// ------------------------------------------------------------------------------------------------
// private redux actions to expose state updates to the applications
//
const orchestration = new OrchestrationClient({
});

const setLoading = loading => ({
  type: 'SET_LOADING',
  loading,
});

const setLoadingMessage = loadingMessage => ({
  type: 'SET_LOADING_MESSAGE',
  loadingMessage,
});

const setConnected = connected => ({
  type: 'SET_CONNECTED',
  connected,
});

const setEnded = ended => ({
  type: 'SET_ENDED',
  ended,
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

const setActiveObjectIds = activeObjectIds => ({
  type: 'SET_ACTIVE_OBJECT_IDS',
  activeObjectIds,
});

const setMuted = muted => ({
  type: 'SET_MUTED',
  muted,
});

const setTransportCapabilities = ({ canPause, canSeek }) => ({
  type: 'SET_TRANSPORT_CAPABILITIES',
  canPause,
  canSeek,
});

const setConnectedDevices = connectedDevices => ({
  type: 'SET_CONNECTED_DEVICES',
  connectedDevices,
});

const setPlaybackStatus = ({
  currentContentId,
  duration,
  loop,
  speed,
  parentTime,
  childTime,
}) => ({
  type: 'SET_PLAYBACK_STATUS',
  currentContentId,
  duration,
  speed,
  loop,
  parentTime,
  childTime,
});

// ------------------------------------------------------------------------------------------------
// private utility methods

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

// ------------------------------------------------------------------------------------------------
// Public redux-thunk actions to notify the orchestration system of user actions
//
export const initialiseOrchestration = (master, {
  joinSessionCode = undefined,
} = {}) => (dispatch) => {
  SEQUENCE_URLS.forEach(({ contentId, url }) => {
    orchestration.registerSequence(contentId, url);
  });

  orchestration.on('loading', (message) => {
    console.debug(message);
    if (message !== false) {
      dispatch(setLoadingMessage(message));
    }
  });

  orchestration.on('status', (e) => {
    dispatch(setPlaybackStatus({
      currentContentId: e.currentContentId,
      duration: e.duration,
      loop: e.loop,
      speed: e.speed,
      parentTime: e.dateNowTime,
      childTime: e.contentTime,
    }));
    dispatch(setTransportCapabilities({
      canSeek: master && !e.loop,
      canPause: master,
    }));
  });

  orchestration.on('devices', (e) => {
    dispatch(setConnectedDevices(e));
  });

  orchestration.on('objects', (e) => {
    dispatch(setActiveObjectIds(e.activeObjectIds));
    dispatch(setPrimaryObject(e.primaryObjectId, e.primaryObjectImageUrl));
  });

  orchestration.on('mute', muted => dispatch(setMuted(muted)));

  orchestration.on('connected', () => dispatch(setConnected(true)));

  orchestration.on('disconnected', () => dispatch(setConnected(false)));

  orchestration.on('error', (e) => {
    dispatch(setError(e.message));
  });

  orchestration.on('ended', (ended) => {
    dispatch(setEnded(ended));
  });

  dispatch(setLoading(true));

  requestSessionId(joinSessionCode)
    .then(({ sessionId, sessionCode }) => {
      dispatch(setSessionCode(sessionCode));
      return orchestration.start(master, sessionId);
    })
    .then(() => {
      dispatch(setRole(master ? 'master' : 'slave'));
      dispatch(setLoading(false));
    })
    .catch((e) => {
      console.error('initialiseOrchestration', e);
    });
};

export const transitionToSequence = contentId => () => {
  orchestration.transitionToSequence(contentId);
};

export const play = () => () => {
  orchestration.play();
};

export const pause = () => () => {
  orchestration.pause();
};

export const seek = relativeOffset => () => {
  orchestration.seek(relativeOffset);
};

export const mute = muted => () => {
  orchestration.mute(muted);
};

export const playAgain = () => () => {
  orchestration.transitionToSequence(INITIAL_CONTENT_ID);
};

export const setDeviceLocation = location => (dispatch) => {
  orchestration.setDeviceLocation(location);
  dispatch({
    type: 'SET_DEVICE_LOCATION',
    location,
  });
};
