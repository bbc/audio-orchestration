window.onload = function()
{
  context = new window.AudioContext();
  bbcat.renderer.HrtfHelper.populateBuffers(hrtfs, context);
  console.log("HRTFs loaded.");
  SetUp();
}


var isMobile = (/Android/g.test(navigator.userAgent) || /Mobile/g.test(navigator.userAgent));
console.log("Mobile? ", isMobile);
var videoURL = isMobile ? "http://vm-1015-user.virt.ch.bbc.co.uk/bbcat-js/demos/foa-demo/pg_mob.mov" :
  "http://vm-1015-user.virt.ch.bbc.co.uk/bbcat-js/demos/foa-demo/pg.mov";

SetUp = function()
{
  SetUpVideo();
  SetUpAudio();

  video.addEventListener('ended', function () {
    video.play();
  });
  video.addEventListener('play', function () {
    // set renderer on
  });
  video.addEventListener('pause', function () {
    // set renderer off
  });
};

SetUpAudio = function()
{
  var mediaElementSource = context.createMediaElementSource(video);
  renderer = bbcat.ambi.createFOABinaural(context, hrtfs);
  mediaElementSource.connect(renderer.inputs[0]);
  var gain = context.createGain();
  gain.gain.value = 50;
  renderer.connect(gain);
  gain.connect(context.destination);

  listenerMat  = mat3.create();
  listenerQuat = quat.create();
};

/**
 * Initialise the 360 pano object
 */
SetUpVideo = function()
{
  stereo    = false;//isMobile;
  video     = document.createElement('video');
  video.src = videoURL;
  video.setAttribute('crossorigin', 'anonymous');

  // If we're on mobile we need a touch to start the video :(
  if (/Android/g.test(navigator.userAgent) || /Mobile/g.test(navigator.userAgent)) {
    console.log("Listening for touch to start...");
    document.querySelector('body').addEventListener('touchend', function(evt) {
      console.log("Starting video");
      evt.target.removeEventListener('touchend', arguments.callee, false);
      video.play();
    }.bind(this), false);
  }
  else
  {
    video.play();
  }

  canvas = document.querySelector('canvas');
  canvas.width  = window.outerWidth  * window.devicePixelRatio;
  canvas.height = window.outerHeight * window.devicePixelRatio;
  var attributes = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
  };
  var names = ['webgl', 'experimental-webgl'];
  for (var n = 0; n < names.length; n++) {
    gl = canvas.getContext(names[n], attributes);
    if (gl)
      break;
  }
  if (!gl)
    throw 'Unable to get a WebGL context.';

  controller = new bbcat.control.GLOrientationControls({ videoOffset: { yaw: Math.PI }});

  viewer     = new bbcat_360.PanoViewer(canvas, video, stereo);
  viewer.orientation_controls = controller;

  // when video starts playing, start animation loop
  video.addEventListener("playing", Tick.bind(this));
};

/**
 * Main animation loop.
 */
Tick = function() {
  // Scale canvas to match screen size if necessary (doing this every frame is
  // heavy-handed, but window.onresized events were not reliable).
  var screen_width  = window.outerWidth  * window.devicePixelRatio;
  var screen_height = window.outerHeight * window.devicePixelRatio;
  if (canvas.width  != screen_width ||
      canvas.height != screen_height) {
    canvas.width  = screen_width;
    canvas.height = screen_height;
  }

  // update listener
  renderer.setTransform(controller.poseQuaternion);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  viewer.UpdateTexture();
  viewer.DrawFrame();
  window.requestAnimationFrame(Tick.bind(this));
};
