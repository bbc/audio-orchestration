import { mat3, mat4, quat } from 'gl-matrix';

export default class OrientationControls {
  constructor(options) {
    if (!options) options = {};
    // When using mouse controls, how sensitive they are, in radians/pixel.
    this.mouseSensitivity = options.mouseSensitivity || 0.004;
    this.dragging  = false;
    this.last_x    = 0;
    this.last_y    = 0;
    this.yaw       = options.initialYaw   || 0;
    this.pitch     = options.initialPitch || 0;
    this.container = options.container    || document.querySelector('body');
    this.notifyCallbacks = [];

    this._poseMat3   = mat3.create();
    this._poseMat4   = mat4.create();
    this._poseQuat   = quat.create();
    this._unitQuat   = quat.create();
    this._yawQuat    = quat.create();
    this._pitchQuat  = quat.create();
    this._rollQuat   = quat.create();

    // Listen for device orientation.
    if (window.DeviceOrientationEvent) {
      // note - for better performance this should be changed for webVR pose data
      window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this), false);
    }

    this.container.addEventListener('mousedown',  this.onMouseDown.bind(this), false);
    this.container.addEventListener('mousemove',  this.onMouseMove.bind(this), false);
    this.container.addEventListener('mouseup',    this.onMouseEnd.bind(this),  false);
    this.container.addEventListener('mouseout',   this.onMouseEnd.bind(this),  false);
    this.container.addEventListener('touchstart', this.onMouseDown.bind(this), false);
    this.container.addEventListener('touchmove',  this.onMouseMove.bind(this), false);
    this.container.addEventListener('touchend',   this.onMouseEnd.bind(this),  false);
  }

  onDeviceOrientation(evt) {
    this.alpha = evt.alpha;
    this.beta  = evt.beta;
    this.gamma = evt.gamma;
  }

  onMouseDown(evt) {
    var x, y;
    if (evt.clientX !== undefined)
    {
      x = evt.clientX;
      y = evt.clientY;
    }
    else if (evt.touches[0].pageX)
    {
      x = evt.touches[0].pageX;
      y = evt.touches[0].pageY;
    }
    this.dragging  = true;
    this.last_x    = x;
    this.last_y    = y;
  }

  onMouseMove(evt) {
    var x, y;
    if (evt.clientX !== undefined) {
      x = evt.clientX;
      y = evt.clientY;
    }
    else if (evt.touches[0].pageX) {
      x = evt.touches[0].pageX;
      y = evt.touches[0].pageY;
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.dragging) {
      this.yaw    += (x - this.last_x) * this.mouseSensitivity;
      this.pitch  += (y - this.last_y) * this.mouseSensitivity;
      this.last_x  = x;
      this.last_y  = y;
    }
  }

  onMouseEnd() {
    this.dragging = false;
  }

  // ADM coordinate system
  //   x - left-right (right +ve)
  //   y - front-back (front +ve)
  //   z - up-down    (up    +ve)
  get poseQuaternion() {
    // Prepare for device orientation
    const degtorad = Math.PI / 180.0;
    if (this.alpha !== null && this.beta !== null && this.gamma !== null) {
      quat.rotateZ(this._yawQuat,   this._unitQuat, this.gamma * degtorad);
      quat.rotateX(this._pitchQuat, this._unitQuat, this.beta  * degtorad);
      quat.rotateY(this._rollQuat,  this._unitQuat,-this.alpha * degtorad);
    }
    // First rotate by yaw and pitch
    quat.rotateZ(this._poseQuat, this._unitQuat, this.yaw);
    quat.rotateX(this._poseQuat, this._poseQuat, this.pitch);
    // Then do device orientation
    if (this.alpha !== null && this.beta !== null && this.gamma !== null) {
      quat.rotateX(this._poseQuat,  this._poseQuat, -90 * degtorad);
      quat.mul(this._poseQuat, this._poseQuat, this._rollQuat);
      quat.mul(this._poseQuat, this._poseQuat, this._pitchQuat);
      quat.mul(this._poseQuat, this._poseQuat, this._yawQuat);
      quat.rotateY(this._poseQuat, this._poseQuat, (window.orientation || 0) * degtorad);
    }
    return this._poseQuat;
  }

  get poseMat3() {
    // Compute a view matrix.
    mat3.fromQuat(this._poseMat3, this.poseQuaternion);
    return this._poseMat3;
  }

  get poseMat4() {
    // Compute a view matrix.
    mat4.fromQuat(this._poseMat4, this.poseQuaternion);
    return this._poseMat4;
  }
};