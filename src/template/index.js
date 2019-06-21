import {
  startSession,
  joinSession,
  requestSetDeviceLocation,
  requestPlay,
  requestPause,
  requestMute,
  requestUnmute,
  requestSeek,
  requestTransitionToSequence,
  connectFormOnCancel,
  connectFormOnSubmit,
  mainSetupOnContinue,
  auxiliaryLocationOnClose,
  auxiliaryLocationOnOpen,
} from './actions';

// TODO putting this here to ensure it is in click event, should probably be in sagas.js instead.
import { ensureAudioContext } from './orchestration';

export { default as reducers } from './reducers';

function mapStateToProps(state) {
  return Object.assign({}, state.exposed);
}

function mapDispatchToProps(dispatch) {
  return {
    startSession: () => {
      ensureAudioContext();
      dispatch(startSession());
    },
    joinSession: (sessionCode) => {
      dispatch(joinSession(sessionCode));
    },
    setDeviceLocation: (location) => {
      dispatch(requestSetDeviceLocation(location));
    },
    play: () => {
      dispatch(requestPlay());
    },
    pause: () => {
      dispatch(requestPause());
    },
    mute: () => {
      dispatch(requestMute());
    },
    unmute: () => {
      dispatch(requestUnmute());
    },
    seek: (seekTime) => {
      dispatch(requestSeek(seekTime));
    },
    transitionToSequence: (contentId) => {
      dispatch(requestTransitionToSequence(contentId));
    },
    connectFormOnCancel: () => {
      dispatch(connectFormOnCancel());
    },
    connectFormOnSubmit: (sessionCode) => {
      ensureAudioContext();
      dispatch(connectFormOnSubmit(sessionCode));
    },
    mainSetupOnContinue: () => {
      dispatch(mainSetupOnContinue());
    },
    auxiliaryLocationOnClose: () => {
      dispatch(auxiliaryLocationOnClose());
    },
    auxiliaryLocationOnOpen: () => {
      dispatch(auxiliaryLocationOnOpen());
    },
  };
}

export {
  mapStateToProps as mapTemplateStateToProps,
  mapDispatchToProps as mapTemplateDispatchToProps,
};
