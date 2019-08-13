// This file exports actions that are to be called directly by the user interface and that affect
// the exposed state. See actions/orchestration.js for actions managing non-exposed state and
// interfacing with the sync services, object allocation, and media players.

export {
  requestPlay,
  requestPause,
  requestSeek,
  requestMute,
  requestUnmute,
  requestSetDeviceTag,
  requestSetVolume,
  requestTransitionToSequence,
} from './orchestration';

export const startSession = () => ({
  type: 'CLICK_CREATE_SESSION',
});

export const joinSession = () => ({
  type: 'CLICK_JOIN_SESSION',
});

export const connectFormOnCancel = () => ({
  type: 'CLOSE_CONNECT_FORM',
});

export const connectFormOnSubmit = sessionCode => ({
  type: 'REQUEST_VALIDATE_SESSION_CODE',
  sessionCode,
});

export const mainSetupOnContinue = () => ({
  type: 'CLICK_MAIN_SETUP_CONTINUE',
});

export const auxiliaryTagOnClose = () => ({
  type: 'REQUEST_CLOSE_AUXILIARY_TAG',
});

export const auxiliaryTagOnOpen = () => ({
  type: 'REQUEST_OPEN_AUXILIARY_TAG',
});
