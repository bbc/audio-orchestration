const defaultState = {
  channelHandler: 'waaEqualPower',
  sources: [],
};

function addSource(state, source) {
  return Object.assign({}, state, {
    sources: [...state.sources, source],
  });
}

function removeSource(state, sourceId) {
  const idx = state.sources.findIndex(s => s.id === sourceId);
  const sources = state.sources.slice();
  sources.splice(idx, 1);

  return Object.assign({}, state, { sources });
}

function setState(state, newState) {
  return Object.assign({}, state, newState);
}

function setChannelHandler(state, channelHandler) {
  return Object.assign({}, state, { channelHandler });
}

function mergeSource(state, sourceId, merge) {
  return Object.assign({}, state, {
    sources: state.sources.reduce((arr, source) => {
      if (source.id === sourceId) {
        arr.push(Object.assign({}, source, merge));
      } else {
        arr.push(source);
      }
      return arr;
    }, []),
  });
}

function setSourceGain(state, sourceId, gain) {
  return mergeSource(state, sourceId, { gain });
}

function setSourceAzimuth(state, sourceId, azimuth) {
  return mergeSource(state, sourceId, { azimuth });
}

function setSourceElevation(state, sourceId, elevation) {
  return mergeSource(state, sourceId, { elevation });
}

function setSourceDistance(state, sourceId, distance) {
  return mergeSource(state, sourceId, { distance });
}

function setSourceUrl(state, sourceId, url) {
  return mergeSource(state, sourceId, { url });
}

function setSourceDescription(state, sourceId, description) {
  return mergeSource(state, sourceId, { description });
}

export default function (state = defaultState, action) {
  switch (action.type) {
    case 'SET_STATE':
      return setState(state, action.state);
    case 'SET_CHANNEL_HANDLER':
      return setChannelHandler(state, action.channelHandler);
    case 'ADD_SOURCE':
      return addSource(state, action.source);
    case 'REMOVE_SOURCE':
      return removeSource(state, action.sourceId);
    case 'SET_SOURCE_GAIN':
      return setSourceGain(state, action.sourceId, action.gain);
    case 'SET_SOURCE_AZIMUTH':
      return setSourceAzimuth(state, action.sourceId, action.azimuth);
    case 'SET_SOURCE_ELEVATION':
      return setSourceElevation(state, action.sourceId, action.elevation);
    case 'SET_SOURCE_DISTANCE':
      return setSourceDistance(state, action.sourceId, action.distance);
    case 'SET_SOURCE_URL':
      return setSourceUrl(state, action.sourceId, action.url);
    case 'SET_SOURCE_DESCRIPTION':
      return setSourceDescription(state, action.sourceId, action.description);
    default:
      return state;
  }
}

export function getSources(state) {
  return state.sources;
}

export function getChannelHandler(state) {
  return state.channelHandler;
}
