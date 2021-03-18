const initialState = {
  role: null,
  page: null,
  connectFormCanCancel: false,
  sessionCodeIsValidating: false,
  sessionCodeIsValid: true,
  sessionCode: null,
  sessionId: null,
  deviceId: null,
  deviceType: null,
  deviceQuality: 1,
  controlValues: {},
  connectedDevices: [],
  activeObjectIds: [],
  activeControlIds: [],
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
  sequenceChoices: [],
  help: false,
  calibration: { enabled: false },
  deviceGain: 0,
  devicePlaybackOffset: 0,
  globalCalibrationState: 'available',
  localCalibrationState: 'disconnected',
  objectAllocations: {},
  controlAllocations: {},
  image: null,
};

const exposed = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.page };
    case 'SET_ROLE':
      return { ...state, role: action.role };
    case 'SET_CONNECT_FORM_CAN_CANCEL':
      return { ...state, connectFormCanCancel: action.canCancel };
    case 'SESSION_CODE_VALID':
      return {
        ...state,
        sessionCodeIsValid: true,
        sessionCodeIsValidating: false,
      };
    case 'SESSION_CODE_INVALID':
      return {
        ...state,
        sessionCodeIsValid: false,
        sessionCodeIsValidating: false,
      };
    case 'SESSION_CODE_VALIDATING':
      return { ...state, sessionCodeIsValidating: true };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.loading,
        loadingMessages: [],
      };
    case 'ADD_LOADING_MESSAGE':
      return { ...state, loadingMessages: [...state.loadingMessages, action.loadingMessage] };
    case 'SET_CONNECTED':
      return { ...state, connected: true };
    case 'SET_DISCONNECTED':
      return { ...state, connected: false };
    case 'SET_DEVICE_ID':
      return { ...state, deviceId: action.deviceId };
    case 'SET_SESSION_CODE':
      return {
        ...state,
        sessionCode: action.sessionCode,
        sessionId: action.sessionId,
      };
    case 'SET_ERROR':
      return {
        ...state,
        errorMessage: action.errorMessage,
        errorShowRetry: action.errorShowRetry,
      };
    case 'SET_ENDED':
      return { ...state, sequenceEnded: action.ended };
    case 'SET_SEQUENCE_CHOICES':
      return {
        ...state,
        sequenceSkippable: action.skippable,
        sequenceChoices: action.choices,
        sequenceHold: action.hold,
      };
    case 'SET_MUTED':
      return { ...state, muted: action.muted };
    case 'REQUEST_SET_CONTROL_VALUES':
      // merge the current state and the controlValues included in the action so we can update one
      // control at a time.
      return { ...state, controlValues: { ...state.controlValues, ...action.controlValues } };
    case 'SET_TRANSPORT_CAPABILITIES':
      return {
        ...state,
        canPause: action.canPause,
        canSeek: action.canSeek,
      };
    case 'SET_PLAYBACK_STATUS':
      return {
        ...state,
        currentContentId: action.currentContentId,
        contentDuration: action.duration,
        contentSpeed: action.speed,
        playing: (action.speed !== 0),
        loop: action.loop,
        contentCorrelation: {
          parentTime: action.parentTime,
          childTime: action.childTime,
        },
      };
    case 'SET_ALLOCATIONS_AND_DEVICES':
      return {
        ...state,
        objectAllocations: action.objectAllocations,
        controlAllocations: action.controlAllocations,
        connectedDevices: action.connectedDevices,
      };
    case 'SET_PRIMARY_OBJECT':
      return {
        ...state,
        primaryObjectId: action.primaryObjectId,
        primaryObjectImage: action.primaryObjectImage,
      };
    case 'SET_ACTIVE_OBJECT_IDS':
      return { ...state, activeObjectIds: action.activeObjectIds };
    case 'SET_ACTIVE_CONTROL_IDS':
      return { ...state, activeControlIds: action.activeControlIds };
    case 'SET_CALIBRATION':
      return { ...state, calibration: action.calibration };
    case 'SET_DEVICE_GAIN':
      return { ...state, deviceGain: action.deviceGain };
    case 'SET_DEVICE_PLAYBACK_OFFSET':
      return { ...state, devicePlaybackOffset: action.devicePlaybackOffset };
    case 'SET_GLOBAL_CALIBRATION_STATE':
      return { ...state, globalCalibrationState: action.globalCalibrationState };
    case 'SET_LOCAL_CALIBRATION_STATE':
      return { ...state, localCalibrationState: action.localCalibrationState };
    case 'SET_IMAGE':
      return { ...state, image: action.image };
    default:
      return state;
  }
};

export default exposed;
