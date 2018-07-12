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
    joinSession: (sessionId) => {
      dispatch(joinSession(sessionId));
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
  };
}

export {
  mapStateToProps as mapTemplateStateToProps,
  mapDispatchToProps as mapTemplateDispatchToProps,
};
