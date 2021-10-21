/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
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

export const errorOnRetry = () => ({
  type: 'CLICK_ERROR_RETRY',
});

export const addDismissedPrompt = (promptId) => ({
  type: 'ADD_DISMISSED_PROMPT',
  promptId,
});
