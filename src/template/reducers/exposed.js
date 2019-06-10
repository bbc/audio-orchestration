const initialState = {
  role: null,
  page: null,
  connectFormCanCancel: false,
  sessionCodeIsValidating: false,
  sessionCodeIsValid: true,
  sessionCode: null,
  sessionId: null,
  deviceId: null,
  deviceLocation: null,
  deviceType: null,
  deviceQuality: 1,
  connectedDevices: [],
  activeObjectIds: [],
  primaryObjectImage: null,
  primaryObjectId: '',
  currentContentId: null,
  contentCorrelation: { parentTime: 0, childTime: 0 },
  contentSpeed: 0,
  contentDuration: 0,
  playing: false,
  loop: false,
  muted: false,
  errorMessage: null,
  loadingMessages: [],
  canReplaceSequence: false,
  canSeek: false,
  canPause: false,
  canDismissError: false,
  connected: false,
  sequenceEnded: false,
  sequenceSkippable: false,
  sequenceHold: false,
  sequenceNext: [],
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
        loadingMessages: [],
      });
    case 'ADD_LOADING_MESSAGE':
      return Object.assign({}, state, {
        loadingMessages: [...state.loadingMessages, action.loadingMessage],
      });
    case 'SET_CONNECTED':
      return Object.assign({}, state, {
        connected: true,
      });
    case 'SET_DISCONNECTED':
      return Object.assign({}, state, {
        connected: false,
      });
    case 'SET_DEVICE_ID':
      return Object.assign({}, state, {
        deviceId: action.deviceId,
      });
    case 'SET_SESSION_CODE':
      return Object.assign({}, state, {
        sessionCode: action.sessionCode,
        sessionId: action.sessionId,
      });
    case 'SET_ERROR':
      return Object.assign({}, state, {
        errorMessage: action.errorMessage,
      });
    case 'SET_ENDED':
      return Object.assign({}, state, {
        sequenceEnded: action.ended,
      });
    case 'SET_SEQUENCE_CHOICES':
      return Object.assign({}, state, {
        sequenceSkippable: action.skippable,
        sequenceNext: action.next,
        sequenceHold: action.hold,
      });
    case 'SET_MUTED':
      return Object.assign({}, state, {
        muted: action.muted,
      });
    case 'REQUEST_SET_DEVICE_LOCATION':
      return Object.assign({}, state, {
        deviceLocation: action.location,
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
        primaryObjectImage: action.primaryObjectImage,
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
