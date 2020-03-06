// ------------------------------------------------------------------------------------------------
// actions dispatched from orchestration event handlers to expose state updates to the applications
export const setLoading = (loading) => ({
  type: 'SET_LOADING',
  loading,
});

export const addLoadingMessage = (loadingMessage) => ({
  type: 'ADD_LOADING_MESSAGE',
  loadingMessage,
});

export const setConnected = () => ({
  type: 'SET_CONNECTED',
});

export const setDisconnected = () => ({
  type: 'SET_DISCONNECTED',
});

export const setEnded = (ended) => ({
  type: 'SET_ENDED',
  ended,
});

export const setSessionCode = (sessionCode) => ({
  type: 'SET_SESSION_CODE',
  sessionCode,
});

export const setRole = (role) => ({
  type: 'SET_ROLE',
  role,
});

export const setErrorMessage = (errorMessage) => ({
  type: 'SET_ERROR',
  errorMessage,
});

export const setPrimaryObject = (primaryObjectId, primaryObjectImage) => ({
  type: 'SET_PRIMARY_OBJECT',
  primaryObjectId,
  primaryObjectImage,
});

export const setActiveObjectIds = (activeObjectIds) => ({
  type: 'SET_ACTIVE_OBJECT_IDS',
  activeObjectIds,
});

export const setActiveControlIds = (activeControlIds) => ({
  type: 'SET_ACTIVE_CONTROL_IDS',
  activeControlIds,
});

export const setMuted = (muted) => ({
  type: 'SET_MUTED',
  muted,
});

export const setTransportCapabilities = ({ canPause, canSeek }) => ({
  type: 'SET_TRANSPORT_CAPABILITIES',
  canPause,
  canSeek,
});

export const setConnectedDevices = (connectedDevices) => ({
  type: 'SET_CONNECTED_DEVICES',
  connectedDevices,
});

export const setPlaybackStatus = ({
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

export const setSequenceChoices = ({
  choices,
  skippable,
  hold,
}) => ({
  type: 'SET_SEQUENCE_CHOICES',
  choices,
  skippable,
  hold,
});

// ------------------------------------------------------------------------------------------------
// actions intended to be called by the user interface to request changes, watched for by a saga

export const requestPlay = () => ({
  type: 'REQUEST_PLAY',
});

export const requestPause = () => ({
  type: 'REQUEST_PAUSE',
});

export const requestSeek = (relativeOffset) => ({
  type: 'REQUEST_SEEK',
  relativeOffset,
});

export const requestSetVolume = (volume) => ({
  type: 'REQUEST_SET_VOLUME',
  volume,
});

export const requestMute = (muted) => ({
  type: 'REQUEST_MUTE_LOCAL',
  muted,
});

export const requestUnmute = (muted) => ({
  type: 'REQUEST_UNMUTE_LOCAL',
  muted,
});

export const requestSetControlValues = (controlValues) => ({
  type: 'REQUEST_SET_CONTROL_VALUES',
  controlValues,
});

export const requestTransitionToSequence = (contentId) => ({
  type: 'REQUEST_TRANSITION_TO_SEQUENCE',
  contentId,
});

// ------------------------------------------------------------------------------------------------
// private utility methods

// const requestSessionId = (userSessionCode) => {
//   let sessionCode = userSessionCode;
//   if (userSessionCode === undefined) {
//     console.warn('Generating random session id, not guaranteed to be unique.');
//     sessionCode = [...Array(SESSION_CODE_LENGTH).keys()]
//       .map(() => `${Math.floor(Math.random() * 10)}`)
//       .join('');
//   }
//
//   return Promise.resolve({
//     sessionCode,
//     sessionId: `bbcat-orchestration-${sessionCode}`,
//   });
// };
