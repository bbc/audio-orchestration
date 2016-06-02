import Kdt from 'kdt';
import CoordinateHelper from './../../coordinate-helper';

/**
 * A class to select a the nearest HRTF from a set of HRTFs to a given position.
 * HRTFs must be provided in the Ircam Binaural FIR format. Given positions must
 * be in BBCAT Cartesian or polar form (see {@link CoordinateHelper}).
 * @see https://github.com/Ircam-RnD/binauralFIR
 */
export default class SpatialiserFilterSelector {
  /**
   * Constructs a new {@link SpatialiserFilterSelector}.
   * @param  {!Array<Object>} hrtfs
   *         An array of HRTFs in the Ircam Binaural FIR format.
   */
  constructor(hrtfs) {
    this._treeNodes = [];
    this._hrtfs = hrtfs;
    this._hrtfs.forEach((hrtf) => {
      const { x, y, z } = CoordinateHelper.convertADMPolarToADMCartesian(
        { az: -hrtf.azimuth, el: hrtf.elevation, d: hrtf.distance });
      this._treeNodes.push({ x, y, z, hrtf });
    });

    this._kdTree = Kdt.createKdTree(
      this._treeNodes, this._distanceSquared, ['x', 'y', 'z']);
  }

  /**
   * Finds the distance squared between two points a and b in Cartesian format.
   * @param  {!Object} a
   *         A coordinate in Cartesian format with properties x, y and z.
   * @param  {!Object} b
   *         A coordinate in Cartesian format with properties x, y and z.
   * @return {number}
   *         The distance squared between the two points a and b.
   */
  _distanceSquared(a, b) {
    // No need to compute square root here for distance comparison.
    return (a.x - b.x) * (a.x - b.x) +
      (a.y - b.y) * (a.y - b.y) +
      (a.z - b.z) * (a.z - b.z);
  }

  /**
   * The array of HRTFs the SpatialiserFilterSelector selects from.
   * @type  {Array<Object>}
   *        An array of HRTFs in the Ircam Binaural FIR format.
   */
  get hrtfs() {
    return this._hrtfs;
  }

  /**
   * Selects the closetst HRTF to the given position from the
   * SpatialiserFilterSelector HRTFs.
   * @param  {!Object} position
   *         A coordinate in BBCAT Cartesian or polar form.
   * @return {Object}
   *         The selected HRTF in Ircam Binaural FIR format.
   */
  getHrtfForPosition(position) {
    const cartesianPosition = CoordinateHelper.convertToADMCartesian(position);
    const nearestTreeNode = this._kdTree.nearest(cartesianPosition, 1)[0][0];
    return nearestTreeNode.hrtf;
  }
}
