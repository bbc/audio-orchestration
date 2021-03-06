import BufferPlayer from '../../src/playback/BufferPlayer';
import DashPlayer from '../../src/playback/DashPlayer';

const audioContext = new AudioContext();

const bufferUrl = 'audio/vostok-intro.m4a';
const dashUrl = 'audio/forest-3-short.mpd';

function getDashPlayer() {
  return new DashPlayer(audioContext, dashUrl, ['stereo', 'mono_0']);
}

function getBufferPlayer() {
  return new BufferPlayer(audioContext, bufferUrl);
}

function initControls(player, playerType) {
  document.getElementById('player-init').style.display = 'none';
  document.getElementById('controls').style.display = 'block';
  document.getElementById('player-type').innerText = playerType;

  const elTime = document.getElementById('time');
  function updateTimes() {
    elTime.innerText = player.currentTime.toFixed(2);
    requestAnimationFrame(updateTimes);
  }
  updateTimes();

  player.on('statechange', (e) => {
    document.getElementById('state').innerText = e.state;
  });

  document.getElementById('btn-prepare').addEventListener('click', () => {
    player.prepare().then(() => {
      player.outputs.forEach((output) => output.connect(audioContext.destination));
    });
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    player.play();
  });

  document.getElementById('btn-seek-forward').addEventListener('click', () => {
    player.seek(audioContext.currentTime, player.currentTime + 5);
  });

  document.getElementById('btn-seek-start').addEventListener('click', () => {
    player.seek(audioContext.currentTime, 0);
  });

  document.getElementById('btn-pause').addEventListener('click', () => {
    player.pause();
  });
}

document.getElementById('btn-dash').addEventListener('click', () => {
  const player = getDashPlayer();
  initControls(player, 'DashPlayer');
});

document.getElementById('btn-buffer').addEventListener('click', () => {
  const player = getBufferPlayer();
  initControls(player, 'BufferPlayer');
});
