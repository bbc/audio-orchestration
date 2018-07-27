const initialState = {
  deviceMainDevice: false,
  deviceLocation: {},
  deviceType: null,
  deviceQuality: 1,
  sessionId: null,
  connectedDeviceTypes: [],
  role: null,
  activeObjectIds: null,
  currentContentId: null,
  contentCorrelation: { parentTime: 0, childTime: 0 },
  contentSpeed: 0,
  contentDuration: 0,
  playing: false,
  muted: false,
  error: false,
  errorMessage: null,
  loading: false,
  canReplaceSequence: false,
  canSeek: false,
  canPause: false,
  canDismissError: false,
  connected: false,
};

const exposed = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return Object.assign({}, state, {
        loading: action.loading,
      });
    case 'SET_CONNECTED':
      return Object.assign({}, state, {
        connected: action.connected,
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
    case 'SET_MUTED':
      return Object.assign({}, state, {
        muted: action.muted,
      });
    case 'SET_DEVICE_LOCATION':
      return Object.assign({}, state, {
        deviceLocation: Object.assign({}, state.deviceLocation, action.location),
      });
    case 'SET_TRANSPORT_CAPABILITIES':
      return Object.assign({}, state, {
        canPause: action.canPause,
        canSeek: action.canSeek,
      });
    case 'SET_PLAYBACK_STATUS':
      return Object.assign({}, state, {
        currentContentId: action.currentContentId,
        contentDuration: action.duration,
        contentSpeed: action.speed,
        playing: (action.speed !== 0),
        contentCorrelation: {
          parentTime: action.parentTime,
          childTime: action.childTime,
        },
      });
    default:
      return state;
  }
};

export default exposed;
