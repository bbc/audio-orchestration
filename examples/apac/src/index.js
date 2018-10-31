import bbcat from 'bbcat';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

navigator.getUserMedia =
  (navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia);

const getUserMediaSettings = {
  audio: {
    optional: [
      // Google's Chrome browser implementation of webRTC includes several audio
      // processing functions that need to be disabled, otherwise the loudness
      // measurement will be wrong.
      { googAutoGainControl: false },
      { googAutoGainControl2: false },
      { googEchoCancellation: false },
      { googEchoCancellation2: false },
      { googNoiseSuppression: false },
      { googNoiseSuppression2: false },
      { googHighpassFilter: false },
      { googTypingNoiseDetection: false },
      { googAudioMirroring: false },

      // W3C documentation suggests the following generic constraints
      // http://www.w3.org/TR/mediacapture-streams/
      { volume: 1.0 },
      { echoCancellation: false },

      // The sample rate should be 48000 Hz for weighting filters to be correct
      // If it's 44100 kHz, the frequency response will be a bit wrong.
      { sampleRate: 48000 },
    ],
  },
};

navigator.getUserMedia(
  getUserMediaSettings,
  (micStream) => {
    const context = new AudioContext();

    const pgSource = context.createBufferSource();
    new bbcat.core.AudioLoader(context)
      .load('./Demo1.m4a')
      .then((buffer) => {
        pgSource.buffer = buffer;
        pgSource.loop = true;
        pgSource.start(0);
      });

    const bgSource = context.createMediaStreamSource(micStream);
    const apacNode = new bbcat.apac.ApacNode(context);
    pgSource.connect(apacNode.programmeInput);
    bgSource.connect(apacNode.backgroundInput);
    apacNode.programmeOutput.connect(context.destination);

    const getApacGain = () => apacNode.gain;
    const getApacCompressionRatio = () => apacNode.compressionRatio;
    const getApacCompressionThreshold = () => apacNode.compressionThreshold;

    const programmeMeter = new bbcat.meter.LoudnessMeter(context);
    const getProgrammeLoudness = () => programmeMeter.spl;
    pgSource.connect(programmeMeter.input);

    const backgroundMeter = new bbcat.meter.LoudnessMeter(context);
    const getBackgroundLoudness = () => backgroundMeter.spl;
    bgSource.connect(backgroundMeter.input);

    const outputMeter = new bbcat.meter.LoudnessMeter(context);
    const getOutputLoudness = () => outputMeter.spl;
    apacNode.programmeOutput.connect(outputMeter.input);

    ReactDOM.render(
      <App
        getApacGain={getApacGain}
        getApacCompressionRatio={getApacCompressionRatio}
        getApacCompressionThreshold={getApacCompressionThreshold}
        getProgrammeLoudness={getProgrammeLoudness}
        getBackgroundLoudness={getBackgroundLoudness}
        getOutputLoudness={getOutputLoudness}
      />,
      document.getElementById('app')
    );
  },
  (e) => { console.log('GetUserMedia failed:', e); });
