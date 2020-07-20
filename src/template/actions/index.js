// This file exports actions that are to be called directly by the user interface and that affect
// the exposed state. See actions/orchestration.js for actions managing non-exposed state and
// interfacing with the sync services, object allocation, and media players.

export {
  requestPlay,
  requestPause,
  requestSeek,
  requestMute,
  requestUnmute,
  requestSetControlValues,
  requestSetVolume,
  requestSetPlaybackOffset,
  requestTransitionToSequence,
  requestToggleCalibrationMode,
  requestStartCalibrationSession,
  requestEndCalibrationSession,
  requestCalibrationSetPlaybackOffset,
} from './orchestration';

export const startSession = () => ({
  type: 'CLICK_CREATE_SESSION',
});

export const joinSession = () => ({
  type: 'CLICK_JOIN_SESSION',
});

export const joinDirect = () => ({
  type: 'CLICK_JOIN_DIRECT',
});

export const connectFormOnCancel = () => ({
  type: 'CLOSE_CONNECT_FORM',
});

export const loadingTutorialContinue = () => ({
  type: 'CLICK_TUTORIAL_CONTINUE',
});

export const openInstructions = () => ({
  type: 'CLICK_OPEN_INSTRUCTIONS',
});

export const closeInstructions = () => ({
  type: 'CLICK_CLOSE_INSTRUCTIONS',
});

export const connectFormOnSubmit = (sessionCode) => ({
  type: 'REQUEST_VALIDATE_SESSION_CODE',
  sessionCode,
});

export const mainSetupOnContinue = () => ({
  type: 'CLICK_MAIN_SETUP_CONTINUE',
});
