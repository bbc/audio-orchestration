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

export const setAllocationsAndDevices = ({
  objectAllocations,
  controlAllocations,
  connectedDevices,
}) => ({
  type: 'SET_ALLOCATIONS_AND_DEVICES',
  objectAllocations,
  controlAllocations,
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

export const setDeviceGain = (
  gain,
) => ({
  type: 'SET_DEVICE_GAIN',
  deviceGain: gain,
});

export const setDevicePlaybackOffset = (
  playbackOffset,
) => ({
  type: 'SET_DEVICE_PLAYBACK_OFFSET',
  devicePlaybackOffset: playbackOffset,
});

export const setGlobalCalibrationState = (
  globalCalibrationState,
) => ({
  type: 'SET_GLOBAL_CALIBRATION_STATE',
  globalCalibrationState,
});

export const setLocalCalibrationState = (
  localCalibrationState,
) => ({
  type: 'SET_LOCAL_CALIBRATION_STATE',
  localCalibrationState,
});

export const receivedCalibrationMessage = (message) => ({
  type: 'RECEIVED_CALIBRATION_MESSAGE',
  message,
});

export const setImage = (
  image,
) => ({
  type: 'SET_IMAGE',
  image,
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

export const requestSetGain = (gain) => ({
  type: 'REQUEST_SET_GAIN',
  gain,
});

export const requestSetPlaybackOffset = (offset) => ({
  type: 'REQUEST_SET_PLAYBACK_OFFSET',
  offset,
});

export const requestToggleCalibrationMode = (calibrationMode) => ({
  type: 'REQUEST_CALIBRATION_MODE',
  calibrationMode,
});

export const requestStartCalibrationSession = () => ({
  type: 'REQUEST_START_CALIBRATION_SESSION',
});

export const requestEndCalibrationSession = () => ({
  type: 'REQUEST_END_CALIBRATION_SESSION',
});

export const requestCalibrationSetPlaybackOffset = (offset) => ({
  type: 'REQUEST_CALIBRATION_SET_PLAYBACK_OFFSET',
  offset,
});

export const requestSendMessage = (message) => ({
  type: 'REQUEST_SEND_MESSAGE',
  message,
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
