import CorrelatedClock from 'dvbcss-clocks/src/CorrelatedClock';
import Players from 'bbcat-orchestration/src/sync-players';
import Sync from 'bbcat-orchestration/src/sync/sync';
import CloudSyncAdapter from 'bbcat-orchestration/src/sync/cloud-sync-adapter';

const url = 'audio/vostok-intro.m4a';
const timelineType = 'tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000';
const cloudSyncEndpoint = 'mqttbroker.edge.platform.2immerse.eu';
const contentId = url;

const audioContext = new AudioContext();
const player = new Players.BufferPlayer(audioContext, url);
player.output.connect(audioContext.destination);

const sync = new Sync(new CloudSyncAdapter({
  sysClock: new Players.AudioContextClock({}, audioContext),
}));
const { wallClock } = sync;

// the master clock can be updated to send updates, but will also be updated by the sync service.
const masterClock = new CorrelatedClock(wallClock, { speed: 0 });

function connect(isMaster = false) {
  const sessionId = document.getElementById('input-session-id').value;
  const deviceId = document.getElementById('input-device-id').value;

  sync.connect(cloudSyncEndpoint, sessionId, deviceId).then(() => {
    console.debug('cloud-sync connected');
  }).catch((e) => {
    console.error(e);
  });

  sync.on('disconnected', () => {
    console.error('sync service disconnected');
  });

  sync.on('broadcast', (message) => {
    console.log('=== Broadcast received ===', message.deviceId, message.topic, message.content);
  });

  sync.on('presence', (message) => {
    console.log('=== Presence ===', message.deviceId, message.status);
  });

  player.prepare().then(() => {
    // master device: publish updates from the timeline clock

    if (isMaster) {
      return sync.provideTimelineClock(masterClock, timelineType, contentId);
    }

    // slave device: receive updates only.
    return sync.requestTimelineClock(timelineType, contentId);
  }).then((timelineClock) => {
    const controller = new Players.SyncController(timelineClock, player, {
      bufferingDelay: 0.1,
    });

    // log changes to the timeline clock
    timelineClock.on('change', () => {
      console.log(`timelineClock.change: child ${timelineClock.getCorrelation().childTime.toFixed(0)}, ` +
                  `parent ${timelineClock.getCorrelation().parentTime.toFixed(0)}, ` +
                  `effective speed ${timelineClock.getEffectiveSpeed()}.`);
    });
  }).catch((e) => {
    console.error(e);
  });
}

function updateTimeline({
  speed = masterClock.getSpeed(),
  contentTime = masterClock.now(),
} = {}) {
  masterClock.setCorrelationAndSpeed({
    parentTime: masterClock.getParent().now(),
    childTime: contentTime,
  }, speed);
}

function initButtons() {
  player.on('statechange', (e) => {
    document.getElementById('state').innerText = e.state;
  });

  document.getElementById('btn-connect').addEventListener('click', (e) => {
    e.target.disabled = true;
    connect(true);
  });

  document.getElementById('btn-connect-slave').addEventListener('click', (e) => {
    e.target.disabled = true;
    connect(false);
  });

  const elTime = document.getElementById('time');
  const elDispersion = document.getElementById('dispersion');
  function updateTimes() {
    elTime.innerText = player.currentTime.toFixed(2);
    elDispersion.innerText = (wallClock.dispersionAtTime(wallClock.now()) * 1000).toFixed(0);
    requestAnimationFrame(updateTimes);
  }
  updateTimes();

  document.getElementById('btn-play').addEventListener('click', () => {
    updateTimeline({ speed: 1 });
  });

  document.getElementById('btn-pause').addEventListener('click', () => {
    updateTimeline({ speed: 0 });
  });

  document.getElementById('btn-seek-start').addEventListener('click', () => {
    updateTimeline({ contentTime: 0 });
  });

  document.getElementById('btn-seek-forward').addEventListener('click', () => {
    updateTimeline({ contentTime: masterClock.now() + (10 * 1000) });
  });
}

initButtons();
