import OrientationControls from './orientation-controls';
import { quat } from 'gl-matrix';

export default class GLOrientationControls extends OrientationControls {
  // ADM coordinate system
  //   x - left-right (right +ve)
  //   y - front-back (front +ve)
  //   z - up-down    (up    +ve)
  get poseQuaternion() {
    // Prepare for device orientation
    const degtorad = Math.PI / 180.0;
    if (this.alpha !== null && this.beta !== null && this.gamma !== null) {
      quat.rotateY(this._yawQuat, this._unitQuat, this.gamma * degtorad);
      quat.rotateX(this._pitchQuat, this._unitQuat, this.beta * degtorad);
      quat.rotateZ(this._rollQuat, this._unitQuat, this.alpha * degtorad);
    }
    // First rotate by yaw and pitch
    quat.rotateY(this._poseQuat, this._unitQuat, this.yaw);
    quat.rotateX(this._poseQuat, this._poseQuat, this.pitch);
    // Then do device orientation
    if (this.alpha !== null && this.beta !== null && this.gamma !== null) {
      quat.rotateX(this._poseQuat, this._poseQuat, -90 * degtorad);
      quat.mul(this._poseQuat, this._poseQuat, this._rollQuat);
      quat.mul(this._poseQuat, this._poseQuat, this._pitchQuat);
      quat.mul(this._poseQuat, this._poseQuat, this._yawQuat);
      quat.rotateZ(this._poseQuat, this._poseQuat, -(window.orientation || 0) * degtorad);
    }
    return this._poseQuat;
  }
}
