// import clocks from 'dvbcss-clocks';
import CorrelatedClock from 'dvbcss-clocks/src/CorrelatedClock';
import Players from 'bbcat-orchestration/src/sync-players';
import SyncAdapter from 'bbcat-orchestration/src/dvbcss-sync-adapter';

const url = 'audio/vostok-intro.m4a';
const timelineType = 'timeline-selector';
const contentId = 'content-id';


const audioContext = new AudioContext();
const player = new Players.BufferPlayer(audioContext, url);
player.output.connect(audioContext.destination);

const webSocketsBase = `${window.location.protocol.replace('http', 'ws')}//${window.location.hostname}:7681`;
const sync = new SyncAdapter({
  sysClock: new Players.AudioContextClock({}, audioContext),
});
const { wallClock } = sync;
const timelineClock = new CorrelatedClock(wallClock);

sync.connect(webSocketsBase).then(() => {
  console.debug('wc connected');
}).catch((e) => {
  console.error(e);
});

player.prepare().then(sync.synchronize(timelineClock, timelineType, contentId)).then(() => {
  console.debug('ts connected');
}).catch((e) => {
  console.error(e);
});

// TODO: we never actually use this, perhaps it should be a function, not an object?
const controller = new Players.SyncController(timelineClock, player, {
  bufferingDelay: 0.1,
});

function initButtons() {
  player.on('statechange', (e) => {
    document.getElementById('state').innerText = e.state;
  });

  const elTime = document.getElementById('time');
  const elDispersion = document.getElementById('dispersion');
  function updateTimes() {
    elTime.innerText = player.currentTime.toFixed(2);
    elDispersion.innerText = (wallClock.dispersionAtTime(wallClock.now()) * 1000).toFixed(0);
    requestAnimationFrame(updateTimes);
  }
  updateTimes();

  document.getElementById('btn-prepare').addEventListener('click', (e) => {
    player.prepare().then(() => {
      e.target.innerText = 'prepared.';
    });
  });

  document.getElementById('btn-play').addEventListener('click', (e) => {
    player.play().then(() => {
      e.target.innerText = 'started playback.';
    });
  });

  document.getElementById('btn-seek-forward').addEventListener('click', (e) => {
    player.seek(audioContext.currentTime, player.currentTime + 10).then(() => {
      e.target.innerText = 'seeked forward';
    });
  });

  document.getElementById('btn-seek-start').addEventListener('click', (e) => {
    player.seek(audioContext.currentTime, 0).then(() => {
      e.target.innerText = 'seeked to start';
    });
  });

  document.getElementById('btn-pause').addEventListener('click', (e) => {
    player.pause().then(() => {
      e.target.innerText = 'paused';
    });
  });
}

initButtons();
