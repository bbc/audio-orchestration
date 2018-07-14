// This file exports actions that are to be called directly by the user interface and that affect
// the exposed state. See actions/orchestration.js for actions managing non-exposed state and
// interfacing with the sync services, object allocation, and media players.

import {
  initialiseOrchestration,
} from './orchestration';

export {
  play,
  pause,
  seek,
  mute,
  log,
  setDeviceLocation,
} from './orchestration';

export const startSession = () => (dispatch) => {
  dispatch(initialiseOrchestration(true));
};

export const joinSession = sessionCode => (dispatch) => {
  dispatch(initialiseOrchestration(false, { joinSessionCode: sessionCode }));
};
