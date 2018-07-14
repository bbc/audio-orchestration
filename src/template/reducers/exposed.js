
const initialState = {
  deviceMainDevice: false,
  deviceLocation: null,
  deviceType: null,
  deviceQuality: 1,
  sessionId: null,
  connectedDeviceTypes: [],
  deviceFriendlyName: null,
  role: null,
  activeObjectIds: null,
  activeSequenceId: null,
  contentTime: 0,
  contentPlaying: false,
  contentDuration: 0,
  error: false,
  errorMessage: null,
  loading: false,
  canReplaceSequence: false,
  canSeek: false,
  canPause: false,
  canDismissError: false,
};

const exposed = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return Object.assign({}, state, {
        loading: action.loading,
      });
    case 'SET_SESSION_CODE':
      return Object.assign({}, state, {
        sessionCode: action.sessionCode,
      });
    case 'SET_ROLE':
      return Object.assign({}, state, {
        role: action.role,
      });
    case 'SET_ERROR':
      return Object.assign({}, state, {
        error: action.error,
        errorMessage: action.errorMessage,
      });
    default:
      return state;
  }
};

export default exposed;
