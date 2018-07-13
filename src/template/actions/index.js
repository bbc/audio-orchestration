const setLoading = isLoading => ({
  type: 'LOADING',
  isLoading,
});

export const startSession = sessionId => (dispatch) => {
  dispatch(setLoading(true));

  dispatch(setLoading(false));
};

export const joinSession = () => (dispatch) => {
  dispatch(setLoading(true));
  return {
    type: '',
  };
};

export const setDeviceLocation = () => {
  return {
    type: '',
  };
};

export const play = () => {
  return {
    type: '',
  };
};

export const pause = () => {
  return {
    type: '',
  };
};

export const mute = () => {
  return {
    type: '',
  };
};

export const seek = () => {
  return {
    type: '',
  };
};

export const log = () => {
  return {
    type: '',
  };
};

export const dismissError = () => {
  return {
    type: '',
  };
};
