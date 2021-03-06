/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import bowser from 'bowser';
import { takeEvery, call, put } from 'redux-saga/effects';
import { orchestration } from '@bbc/audio-orchestration-core';

import config from 'config';
import {
  addLoadingMessage,
  setConnected,
  setDisconnected,
  setEnded,
  setErrorMessage,
  setAllocationsAndDevices,
  setPrimaryObject,
  setActiveObjectIds,
  setActiveControlIds,
  setMuted,
  setTransportCapabilities,
  setPlaybackStatus,
  setSequenceChoices,
  setDeviceGain,
  setDevicePlaybackOffset,
  receivedCalibrationMessage,
  setImage,
} from 'actions/orchestration';
import {
  initialiseCalibrationOrchestration,
} from './calibrationOrchestration';

const { OrchestrationClient } = orchestration;

let dispatch = null;

// A global browser detection object
const browser = bowser.getParser(window.navigator.userAgent);
const isSafari = browser.is('Safari') || browser.is('iOS');

// A global reference to the audio context. It has to be created on a user action and then passed
// into OrchestrationClient.start().
let globalAudioContext = null;

// A global orchestration object - this is the only instance of it. It is started with a sessionId,
// deviceId, and audioContext reference in connectOrchestration.
let globalOrchestrationClient = null;

// A global object (controlId => controlValues[]) of current values for all controls on this device.
// TODO: This replicates state, listening to the same Redux actions to keep up to date, and that is
// a bit ugly.
const globalDeviceControlValues = {};

/**
 * Ensure an audio context exists.
 */
export const ensureAudioContext = () => {
  if (globalAudioContext !== null) {
    globalAudioContext.resume();
  } else {
    globalAudioContext = OrchestrationClient.createAudioContext();
  }
  return globalAudioContext;
};

/**
 * Initialise the orchestration object by registering the sequences to load and setting up
 * event handlers. The event handlers dispatch actions that expose the orchestration state to the
 * user interface, via the redux state.
 *
 * @param {function} dispatch - the redux store's dispatch method.
 *
 * @returns {string} deviceId
 */
export const initialiseOrchestration = (dispatchFunction) => {
  dispatch = dispatchFunction;
  let transitionOnEnded = null;
  let transitionOnCondition = null;
  let lastStatusContentId = null;

  globalOrchestrationClient = new OrchestrationClient({
    initialContentId: config.INITIAL_CONTENT_ID,
    syncEndpoint: config.SYNC_ENDPOINT,
    sequenceTransitionDelay: config.SEQUENCE_TRANSITION_DELAY,
    loadingTimeout: config.LOADING_TIMEOUT,
    controls: config.CONTROLS,
    isSafari,
    objectFadeOutDuration: config.OBJECT_FADE_OUT_DURATION,
  });

  config.SEQUENCE_URLS.forEach(({ contentId, url }) => {
    globalOrchestrationClient.registerSequence(contentId, url);
  });

  globalOrchestrationClient.on('loading', (message) => {
    if (message !== false) {
      dispatch(addLoadingMessage(message));
    }
  });

  globalOrchestrationClient.on('status', (e) => {
    dispatch(setPlaybackStatus({
      currentContentId: e.currentContentId,
      duration: e.duration,
      loop: e.loop,
      speed: e.speed,
      parentTime: e.dateNowTime,
      childTime: e.contentTime,
    }));

    dispatch(setTransportCapabilities({
      canSeek: globalOrchestrationClient.isMain,
      canPause: globalOrchestrationClient.isMain || config.ENABLE_PLAY_PAUSE_ON_AUX,
    }));

    if (globalOrchestrationClient.isMain && lastStatusContentId !== e.currentContentId) {
      const {
        next,
        skippable,
        hold,
        transitionOnMinNumberOfAuxDevices,
      } = config.SEQUENCE_URLS.find(({ contentId }) => contentId === e.currentContentId);

      if (!hold && !e.loop && next.length > 0) {
        transitionOnEnded = next[0].contentId;
      } else {
        transitionOnEnded = null;
      }

      if (transitionOnMinNumberOfAuxDevices && next.length > 0) {
        transitionOnCondition = {
          minNumberOfAuxDevices: transitionOnMinNumberOfAuxDevices,
          contentId: next[0].contentId,
        };
      } else {
        transitionOnCondition = null;
      }

      if (!hold && !e.loop && next.length > 0) {
        transitionOnEnded = next[0].contentId;
      } else {
        transitionOnEnded = null;
      }

      dispatch(setSequenceChoices({
        choices: next,
        skippable,
        hold,
      }));

      lastStatusContentId = e.currentContentId;
    }
  });

  globalOrchestrationClient.on('change', () => {
    const {
      currentContentId,
      objectAllocations,
      controlAllocations,
      devices,
    } = globalOrchestrationClient;

    // Only put allocations for the current sequence into the state.
    dispatch(setAllocationsAndDevices({
      objectAllocations: objectAllocations[currentContentId] || {},
      controlAllocations: controlAllocations[currentContentId] || {},
      connectedDevices: devices || [],
    }));

    if (globalOrchestrationClient.isMain && transitionOnCondition) {
      const {
        minNumberOfAuxDevices,
        contentId,
      } = transitionOnCondition;

      // devices.length includes main device in count
      if (devices.length >= minNumberOfAuxDevices + 1) {
        transitionOnCondition = null;
        globalOrchestrationClient.transitionToSequence(contentId);
      }
    }
  });

  globalOrchestrationClient.on('objects', (e) => {
    dispatch(setActiveObjectIds(e.activeObjectIds));
    dispatch(setPrimaryObject(e.primaryObjectId, e.primaryObjectImage));
  });

  globalOrchestrationClient.on('controls', (e) => {
    dispatch(setActiveControlIds(e.activeControlIds));
  });

  globalOrchestrationClient.on('mute', (muted) => dispatch(setMuted(muted)));

  globalOrchestrationClient.on('connected', () => dispatch(setConnected()));

  globalOrchestrationClient.on('disconnected', () => {
    dispatch(setDisconnected());
  });

  globalOrchestrationClient.on('error', (e) => {
    dispatch(setErrorMessage(e.message));
  });

  globalOrchestrationClient.on('ended', (ended) => {
    dispatch(setEnded(ended));

    if (ended && globalOrchestrationClient.isMain && transitionOnEnded !== null) {
      const nextContentId = transitionOnEnded;
      transitionOnEnded = null;
      // The orchestration client/renderer pause after emitting the ended event, so can't
      // request a transition immediately.
      setTimeout(() => {
        globalOrchestrationClient.transitionToSequence(nextContentId);
      }, 300);
    }
  });

  globalOrchestrationClient.on('unavailable', () => {
    globalOrchestrationClient.mute(true);
    globalOrchestrationClient.pause();
  });

  globalOrchestrationClient.on('available', () => {
    globalOrchestrationClient.mute(false);
  });

  globalOrchestrationClient.on('disconnected', () => {
    globalOrchestrationClient.mute(true);
  });

  globalOrchestrationClient.on('loaded', () => {
    globalOrchestrationClient.setDeviceMetadata({
      deviceType: browser.getPlatform().type,
    });
  });

  globalOrchestrationClient.on('message', (message) => {
    switch (message.type) {
      case 'pause':
        if (globalOrchestrationClient.isMain) {
          globalOrchestrationClient.pause();
        }
        break;
      case 'play':
        if (globalOrchestrationClient.isMain) {
          globalOrchestrationClient.play();
        }
        break;
      case 'transitionToSequence':
        if (globalOrchestrationClient.isMain) {
          globalOrchestrationClient.transitionToSequence(message.contentId);
        }
        break;
      default:
        dispatch(receivedCalibrationMessage(message));
    }
  });

  globalOrchestrationClient.on('image', (image) => {
    if (!image) {
      dispatch(setImage(null));
    } else {
      dispatch(setImage(image));
    }
  });

  return globalOrchestrationClient.deviceId;
};

export const connectOrchestration = (isMain, sessionId) => {
  // On connecting, first decide which SyncAdapter to dynamically import, and set this on the
  // OrchestrationClient instance.
  let syncAdapterClass;
  let syncAdapterImport;
  switch (config.SYNC_ENDPOINT?.type) {
    case 'peerjs':
      syncAdapterImport = import('@bbc/audio-orchestration-core/peerSyncAdapter')
        .then(({ PeerSyncAdapter }) => {
          syncAdapterClass = PeerSyncAdapter;
        });
      break;
    case 'cloud-sync':
    default:
      syncAdapterImport = import('@bbc/audio-orchestration-core/cloudSyncAdapter')
        .then(({ CloudSyncAdapter }) => {
          syncAdapterClass = CloudSyncAdapter;
        });
  }

  return syncAdapterImport.then(() => {
    globalOrchestrationClient.setSyncAdapterClass(syncAdapterClass);
  })
    .then(() => globalOrchestrationClient.start(
      isMain,
      sessionId,
      globalAudioContext,
    ))
    .then(() => {
      if (!isMain) {
        globalOrchestrationClient.setCompressorRatio(config.MDO_COMPRESSOR_RATIO);
        globalOrchestrationClient.setCompressorThreshold(config.MDO_COMPRESSOR_THRESHOLD);
      }
    })
    .then(() => {
      initialiseCalibrationOrchestration({
        dispatch,
        ensureAudioContext,
        isSafari,
        isMain: globalOrchestrationClient.isMain,
        deviceId: globalOrchestrationClient.deviceId,
        syncAdapterClass,
      });
    })
    .catch((e) => {
      console.error('connectOrchestration error:', e);
      throw e || new Error('Unknown error in connectOrchestration');
    });
};

function* transitionToSequence({ contentId }) {
  if (globalOrchestrationClient.isMain) {
    yield call(() => globalOrchestrationClient.transitionToSequence(contentId));
  } else {
    yield call(() => globalOrchestrationClient.sendMessage({
      type: 'transitionToSequence',
      contentId,
    }));
  }
}

function* play() {
  if (globalOrchestrationClient.isMain) {
    yield call(() => globalOrchestrationClient.play());
  } else {
    yield call(() => globalOrchestrationClient.sendMessage({
      type: 'play',
    }));
  }
}

function* pause() {
  if (globalOrchestrationClient.isMain) {
    yield call(() => globalOrchestrationClient.pause());
  } else {
    yield call(() => globalOrchestrationClient.sendMessage({
      type: 'pause',
    }));
  }
}

function* seek({ relativeOffset }) {
  yield call(() => globalOrchestrationClient.seek(relativeOffset));
}

function* mute() {
  yield call(() => globalOrchestrationClient.mute(true));
}

function* unmute() {
  yield call(() => globalOrchestrationClient.mute(false));
}

function* setDeviceControls({ controlValues }) {
  // Keep the globalDeviceControlValues in sync by replacing any values stored for controls that are
  // included in this update.
  Object.entries(controlValues).forEach(([k, v]) => {
    globalDeviceControlValues[k] = v;
  });

  // Set the deviceControls in the device metadata, which is a complete list of all controls
  yield call(() => globalOrchestrationClient.setDeviceMetadata({
    deviceControls: Object.entries(globalDeviceControlValues).map(([k, v]) => ({
      controlId: k,
      controlValues: v,
    })),
  }));
}

function* setGain({ gain }) {
  yield call(() => { globalOrchestrationClient.setGain(gain); });
  yield put(setDeviceGain(gain));
}

function* setPlaybackOffset({ offset }) {
  yield call(() => { globalOrchestrationClient.setPlaybackOffset(offset); });
  yield put(setDevicePlaybackOffset(offset));
}

function* sendMessage({ message }) {
  yield call(() => { globalOrchestrationClient.sendMessage(message); });
}

export const orchestrationWatcherSaga = function* orchestrationWatcherSaga() {
  // Player and orchestration controls
  yield takeEvery('REQUEST_PLAY', play);
  yield takeEvery('REQUEST_PAUSE', pause);
  yield takeEvery('REQUEST_SEEK', seek);
  // yield takeEvery('REQUEST_SET_VOLUME', ...);
  yield takeEvery('REQUEST_MUTE_LOCAL', mute);
  yield takeEvery('REQUEST_UNMUTE_LOCAL', unmute);
  yield takeEvery('REQUEST_SET_CONTROL_VALUES', setDeviceControls);
  yield takeEvery('REQUEST_TRANSITION_TO_SEQUENCE', transitionToSequence);
  yield takeEvery('REQUEST_SET_GAIN', setGain);
  yield takeEvery('REQUEST_SET_PLAYBACK_OFFSET', setPlaybackOffset);
  yield takeEvery('REQUEST_COMPRESSOR_SETTINGS', function* setCompressorSettings(action) {
    yield call(() => globalOrchestrationClient.setCompressorRatio(action.ratio));
    yield call(() => globalOrchestrationClient.setCompressorThreshold(action.threshold));
  });
  yield takeEvery('REQUEST_SEND_MESSAGE', sendMessage);
};
