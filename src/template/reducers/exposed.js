const initialState = {
  role: null,
  page: null,
  connectFormCanCancel: false,
  sessionCodeIsValidating: false,
  sessionCodeIsValid: true,

  deviceMainDevice: false,
  deviceLocation: {},
  deviceType: null,
  deviceQuality: 1,
  sessionId: null,
  connectedDevices: [],
  activeObjectIds: [],
  primaryObjectId: '',
  primaryObjectImageUrl: null,
  currentContentId: null,
  contentCorrelation: { parentTime: 0, childTime: 0 },
  contentSpeed: 0,
  contentDuration: 0,
  playing: false,
  loop: false,
  muted: false,
  errorMessage: null,
  loadingMessage: '',
  canReplaceSequence: false,
  canSeek: false,
  canPause: false,
  canDismissError: false,
  connected: false,
  ended: false,
  help: false,
};

const exposed = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_PAGE':
      return Object.assign({}, state, {
        page: action.page,
      });
    case 'SET_ROLE':
      return Object.assign({}, state, {
        role: action.role,
      });
    case 'SET_CONNECT_FORM_CAN_CANCEL':
      return Object.assign({}, state, {
        connectFormCanCancel: action.canCancel,
      });
    case 'SESSION_CODE_VALID':
      return Object.assign({}, state, {
        sessionCodeIsValid: true,
        sessionCodeIsValidating: false,
      });
    case 'SESSION_CODE_INVALID':
      return Object.assign({}, state, {
        sessionCodeIsValid: false,
        sessionCodeIsValidating: false,
      });
    case 'SESSION_CODE_VALIDATING':
      return Object.assign({}, state, {
        sessionCodeIsValidating: true,
      });

    case 'SET_LOADING':
      return Object.assign({}, state, {
        loading: action.loading,
      });
    case 'SET_LOADING_MESSAGE':
      return Object.assign({}, state, {
        loadingMessage: action.loadingMessage,
      });
    case 'SET_CONNECTED':
      return Object.assign({}, state, {
        connected: action.connected,
      });
    case 'SET_SESSION_CODE':
      return Object.assign({}, state, {
        sessionCode: action.sessionCode,
      });
    case 'SET_ERROR':
      return Object.assign({}, state, {
        errorMessage: action.errorMessage,
      });
    case 'SET_ENDED':
      return Object.assign({}, state, {
        ended: action.ended,
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
        loop: action.loop,
        contentCorrelation: {
          parentTime: action.parentTime,
          childTime: action.childTime,
        },
      });
    case 'SET_CONNECTED_DEVICES':
      return Object.assign({}, state, {
        connectedDevices: action.connectedDevices,
      });
    case 'SET_PRIMARY_OBJECT':
      return Object.assign({}, state, {
        primaryObjectId: action.primaryObjectId,
        primaryObjectImageUrl: action.primaryObjectImageUrl,
      });
    case 'SET_ACTIVE_OBJECT_IDS':
      return Object.assign({}, state, {
        activeObjectIds: action.activeObjectIds,
      });
    default:
      return state;
  }
};

export default exposed;
