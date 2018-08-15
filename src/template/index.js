import {
  startSession,
  joinSession,
  requestSetDeviceLocation,
  requestPlay,
  requestPause,
  requestMute,
  requestSeek,
  requestPlayAgain,
  requestTransitionToSequence,
  connectFormOnCancel,
  connectFormOnSubmit,
  masterSetupOnContinue,
  slaveLocationOnClose,
  slaveLocationOnOpen,
} from './actions';

export { default as reducers } from './reducers';

function mapStateToProps(state) {
  return Object.assign({}, state.exposed);
}

function mapDispatchToProps(dispatch) {
  return {
    startSession: () => {
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
    mute: (muted) => {
      dispatch(requestMute(muted));
    },
    seek: (seekTime) => {
      dispatch(requestSeek(seekTime));
    },
    playAgain: () => {
      dispatch(requestPlayAgain());
    },
    transitionToSequence: (contentId) => {
      dispatch(requestTransitionToSequence(contentId));
    },
    connectFormOnCancel: () => {
      dispatch(connectFormOnCancel);
    },
    connectFormOnSubmit: (sessionCode) => {
      dispatch(connectFormOnSubmit(sessionCode));
    },
    masterSetupOnContinue: () => {
      dispatch(masterSetupOnContinue());
    },
    slaveLocationOnClose: () => {
      dispatch(slaveLocationOnClose());
    },
    slaveLocationOnOpen: () => {
      dispatch(slaveLocationOnOpen());
    },
  };
}

export {
  mapStateToProps as mapTemplateStateToProps,
  mapDispatchToProps as mapTemplateDispatchToProps,
};
