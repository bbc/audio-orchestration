export function setState(state) {
  return {
    type: 'SET_STATE',
    state,
  };
}

export function setChannelHandler(channelHandler) {
  return {
    type: 'SET_CHANNEL_HANDLER',
    channelHandler,
  };
}

export function setSourceGain(sourceId, gain) {
  return {
    type: 'SET_SOURCE_GAIN',
    sourceId,
    gain,
  };
}

export function setSourceAzimuth(sourceId, azimuth) {
  return {
    type: 'SET_SOURCE_AZIMUTH',
    sourceId,
    azimuth,
  };
}

export function setSourceElevation(sourceId, elevation) {
  return {
    type: 'SET_SOURCE_ELEVATION',
    sourceId,
    elevation,
  };
}

export function setSourceDistance(sourceId, distance) {
  return {
    type: 'SET_SOURCE_DISTANCE',
    sourceId,
    distance,
  };
}

export function setSourceUrl(sourceId, url) {
  return {
    type: 'SET_SOURCE_URL',
    sourceId,
    url,
  };
}

export function setSourceDescription(sourceId, description) {
  return {
    type: 'SET_SOURCE_DESCRIPTION',
    sourceId,
    description,
  };
}

export function addSource(source) {
  return {
    type: 'ADD_SOURCE',
    source,
  };
}

export function removeSource(sourceId) {
  return {
    type: 'REMOVE_SOURCE',
    sourceId,
  };
}
