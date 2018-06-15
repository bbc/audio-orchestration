import BufferPlayer from 'bbcat-orchestration/src/sync-players/buffer-player';

const url = 'audio/vostok-intro.m4a';
const audioContext = new AudioContext();
const player = new BufferPlayer(audioContext, url);
player.output.connect(audioContext.destination);

player.on('statechange', (e) => {
  document.getElementById('state').innerText = e.state;
});

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
