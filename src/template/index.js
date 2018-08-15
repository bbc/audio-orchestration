import {
  startSession,
  joinSession,
  setDeviceLocation,
  play,
  pause,
  mute,
  seek,
  log,
  dismissError,
  playAgain,
  transitionToSequence,
  connectFormOnCancel,
  connectFormOnSubmit,
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
      dispatch(setDeviceLocation(location));
    },
    play: () => {
      dispatch(play());
    },
    pause: () => {
      dispatch(pause());
    },
    mute: (muted) => {
      dispatch(mute(muted));
    },
    seek: (seekTime) => {
      dispatch(seek(seekTime));
    },
    log: (message) => {
      dispatch(log(message));
    },
    dismissError: () => {
      dispatch(dismissError());
    },
    playAgain: () => {
      dispatch(playAgain());
    },
    transitionToSequence: (contentId) => {
      dispatch(transitionToSequence(contentId));
    },
    connectFormOnCancel: () => {
      dispatch(connectFormOnCancel);
    },
    connectFormOnSubmit: (sessionCode) => {
      dispatch(connectFormOnSubmit(sessionCode));
    },
  };
}

export {
  mapStateToProps as mapTemplateStateToProps,
  mapDispatchToProps as mapTemplateDispatchToProps,
};
