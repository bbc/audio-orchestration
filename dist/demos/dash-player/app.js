// The bbcat library is statically included in index.html.
// All modules can be accessed on the global bbcat object.

function setupPlayer(blob) {
  // Configure audio graph for player.
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var context = new AudioContext();
  var manifest = new bbcat.dash.ManifestParser().parse(blob);
  var dashSource = new bbcat.dash.DashSourceNode(context, manifest);

  for (var i = 0; i < dashSource.numberOfOutputs; i++) {
    dashSource.connect(context.destination, i);
  }

  // Initialise app defaults and get required DOM elements.
  var playTime = 0;
  var updatePlayTime = true;
  var pollPlaytimeInterval = null;
  var pollPlaytime = setInterval(function() {
    if (dashSource.state === 'playing') {
      var time = dashSource.getCurrentPlaybackTime();
      if (time && updatePlayTime) {
        label.innerHTML = Math.round(time);
        range.value = time;
      }
    }
  }, 200);

  var playButton = document.getElementById("playButton");
  var stopButton = document.getElementById("stopButton");
  var range = document.getElementById("range");
  range.value = playTime;
  range.max = dashSource.playbackDuration;
  range.step = 1;
  range.min = 0;
  var label = document.getElementById("label");
  label.innerHTML = playTime;

  // Add listeners for events on dashSourceNode and inputs.
  dashSource.addEventListener('ended', function () {
    console.log('Playback ended.');
  });
  dashSource.addEventListener('statechange', function (e) {
    console.log(`Player is now ${e.state}.`);
  });

  playButton.addEventListener('click', function() {
    dashSource.start(playTime);
  });

  stopButton.addEventListener('click', function() {
    dashSource.stop();
  });

  // On dragging of the slider.
  range.addEventListener('input', function() {
    updatePlayTime = false;
    label.innerHTML = Math.round(range.value);
  });

  // On slider release.
  range.addEventListener('change', function() {
    updatePlayTime = true;
    playTime = parseFloat(range.value) || 0;
    if (dashSource.state === 'playing') {
      dashSource.stop();
      dashSource.start(playTime);
    }
  });
}

var manifestURL = 'http://vm-1015-user.virt.ch.bbc.co.uk/dash/everythingeverything/everythingeverything.mpd';
new bbcat.dash.ManifestLoader()
  .load(manifestURL)
  .then(setupPlayer)
  .catch(function(error) {
    console.log(error);
  });
