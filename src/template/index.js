import {
  startSession,
  joinSession,
  requestSetDeviceTag,
  requestPlay,
  requestPause,
  requestMute,
  requestUnmute,
  requestSeek,
  requestTransitionToSequence,
  connectFormOnCancel,
  connectFormOnSubmit,
  mainSetupOnContinue,
  auxiliaryTagOnClose,
  auxiliaryTagOnOpen,
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
    setDeviceTag: (tag) => {
      dispatch(requestSetDeviceTag(tag));
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
    auxiliaryTagOnClose: () => {
      dispatch(auxiliaryTagOnClose());
    },
    auxiliaryTagOnOpen: () => {
      dispatch(auxiliaryTagOnOpen());
    },
  };
}

export {
  mapStateToProps as mapTemplateStateToProps,
  mapDispatchToProps as mapTemplateDispatchToProps,
};
