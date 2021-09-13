import Sync from 'bbcat-orchestration/src/sync';
import CloudSyncAdapter from 'bbcat-orchestration/src/sync/cloud-sync-adapter';
import AudioContextClock from 'bbcat-orchestration/src/sync-players/audio-context-clock';
import {
  SynchronisedSequenceRenderer,
  Sequence,
} from 'bbcat-orchestration/src/sequence-renderer';
// import OffsetClock from 'dvbcss-clocks/src/OffsetClock';
import CorrelatedClock from 'dvbcss-clocks/src/CorrelatedClock';
import sequenceData from './sequence.json';

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const CLOUD_SYNC_ENDPOINT = { hostname: 'cloudsync.virt.ch.bbc.co.uk' };

const USE_TONE = true;
const USE_NOISE = false;
const USE_SEQUENCE = false;

const sequence = new Sequence(sequenceData);

function initOrchestration() {
  const audioContext = new AudioContext();
  audioContext.resume();

  console.log('audio context created.');

  const adapter = new CloudSyncAdapter({
    sysClock: new AudioContextClock({}, audioContext),
  });

  const sync = new Sync(adapter);

  return sync.connect(
    CLOUD_SYNC_ENDPOINT,
    'bbcat-orchestration-calibration-example',
    `bbcat-orchestration-calibration-${Math.floor(Math.random() * 10000)}`,
  ).then(() => {
    console.log('sync connected.');
    const { wallClock } = sync;
    const offsetClock = new CorrelatedClock(wallClock, { correlation: [0, 0] });

    if (USE_SEQUENCE) {
      const renderer = new SynchronisedSequenceRenderer(audioContext, offsetClock, sequence, false);
      renderer.setActiveObjectIds(['clicks']);
      renderer.output.connect(audioContext.destination);

      renderer.start(0, 0);
    }

    return offsetClock;
  }).then((offsetClock) => {
    const clickPeriod = 1000;
    const clickDuration = 50;
    const OFF = 1.0e-6;
    const ON = 1.0;

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, OFF);
    gain.connect(audioContext.destination);

    if (USE_TONE) {
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.value = 1000;
      oscillator.connect(gain);
      oscillator.start();
    }

    if (USE_NOISE) {
      const rate = audioContext.sampleRate;
      const noiseBuffer = audioContext.createBuffer(1, 1 * rate, rate);
      const channelData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i += 1) {
        channelData[i] = (Math.random() * 2) - 1;
      }

      const noise = audioContext.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      noise.connect(gain);
      noise.start();
    }

    setInterval(() => {
      const { wallClock } = sync;
      const now = (wallClock.now() / wallClock.tickRate) * 1000; // in ms
      const nextStart = (Math.floor(now) - (Math.floor(now) % clickPeriod)) + clickPeriod;

      const audioNow = offsetClock.calcWhen(now);
      const audioNext = offsetClock.calcWhen(nextStart);
      const wcAudioNext = wallClock.calcWhen(nextStart);
      const audioEnd = offsetClock.calcWhen(nextStart + clickDuration);

      // console.log(Math.round(wcAudioNext * 1000), '\t', Math.round(audioNext * 1000), '\t', offsetClock.offset);
      // console.log(Math.round(offsetClock.now()), '\t', Math.round(wallClock.now()), '\t', offsetClock.offset);
      // console.log(Math.round(offsetClock.calcWhen(wallClock.now())) - Math.round(wallClock.calcWhen(wallClock.now())), '\t', offsetClock.offset);

      gain.gain.cancelScheduledValues(audioNow);
      gain.gain.setValueAtTime(OFF, audioNow);
      gain.gain.setValueAtTime(ON, audioNext);
      gain.gain.setValueAtTime(OFF, audioEnd);
    }, 100);

    return offsetClock;
  }).catch((e) => {
    console.error(e);
    throw e;
  });
}

function init() {
  initOrchestration().then((offsetClock) => {
    console.log('orchestration initialised');
    let currentOffset = 0;

    const changeOffset = (increment) => {
      currentOffset = (Math.max(-1000, Math.min(currentOffset + increment, 1000)));
      offsetClock.setCorrelation([0, currentOffset]);
      document.getElementById('current-offset').innerText = currentOffset;
    };

    document.getElementById('btn-increase').addEventListener('click', () => changeOffset(10));
    document.getElementById('btn-decrease').addEventListener('click', () => changeOffset(-10));

    setInterval(() => {
      document.getElementById('current-time').style.width = `${(((offsetClock.now()) % 10000) / 10000) * 100}%`;
    }, 100);

    changeOffset(0);
  });
}

document.getElementById('btn-init').addEventListener('click', () => {
  document.getElementById('connect').style.display = 'none';
  document.getElementById('calibrate').style.display = 'block';
  init();
});
