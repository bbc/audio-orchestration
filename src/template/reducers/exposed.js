
const initialState = {
  deviceMainDevice: false,
  deviceLocation: null,
  deviceType: null,
  deviceQuality: 1,
  sessionId: null,
  deviceId: null,
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
  connected: false,
  canReplaceSequence: false,
  canSeek: false,
  canPause: false,
  canDismissError: false,
};

const exposed = (state = initialState, action) => {
  switch (action.type) {
    case 'LOADING':
      return state;
    default:
      return state;
  }
};

export default exposed;
