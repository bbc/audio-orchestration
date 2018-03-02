var AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
let meter = null;
let microphone = null;
var constraints = {
  audio: true,
  video: false
};

navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {    
    microphone = context.createMediaStreamSource(stream);
    meter = new bbcat.meter.RmsMeterWorklet(context);
    meter.construct().then(() => {
      microphone.connect(meter.input);
      meter.connect(context.destination);
    });
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
  });