var AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
let meter = null;
let lMeter = null;
let microphone = null;
var constraints = {
  audio: true,
  video: false
};

navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    microphone = context.createMediaStreamSource(stream);
    meter = new bbcat.meter.RmsMeterWorklet(context);
    lMeter = new bbcat.meter.LoudnessMeterWorklet(context);
    lMeter.construct().then(() => {
      microphone.connect(lMeter.input);
      lMeter.connect(context.destination);
      // lMeter.construct.then(() => {
      //   microphone.connect(lMeter.input);
      //   lMeter.connect(context.destination);
      // });
    });
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
  });