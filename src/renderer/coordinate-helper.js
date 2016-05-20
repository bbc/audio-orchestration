import { Vector3 } from 'three';

/**
 * A class that provides static methods for validating ADM coordinates and
 * converting between ADM polar and ADM Cartesian coordinate representations.
 * For definitions of these representations see EBU TECH 3364 (pages 31-32.)
 * @see https://tech.ebu.ch/docs/tech/tech3364.pdf
 * @public
 */
export default class CoordinateHelper {
  /**
   * Validates whether a object is an ADM polar coordinate.
   * @param  {!Object} coordinate
   *         An object to be validated.
   * @return {boolean}
   *         True is the coordinate is valid. Otherwise; false.
   */
  static isValidADMPolarCoordinate(coordinate) {
    return coordinate && coordinate.polar === true &&
      !isNaN(coordinate.d) && coordinate.d >= 0 &&
      !isNaN(coordinate.az) && coordinate.az >= -180 && coordinate.az <= 180 &&
      !isNaN(coordinate.el) && coordinate.el >= -90 && coordinate.el <= 90;
  }

  /**
   * Validates whether a object is an ADM Cartesian coordinate.
   * @param  {!Object} coordinate
   *         An object to be validated.
   * @return {boolean}
   *         True is the coordinate is valid. Otherwise; false.
   */
  static isValidADMCartesianCoordinate(coordinate) {
    return coordinate && coordinate.polar === false &&
      !isNaN(coordinate.x) && !isNaN(coordinate.y) && !isNaN(coordinate.z);
  }

  /**
   * Validates whether a object is an ADM polar or Cartesian coordinate.
   * @param  {!Object} coordinate
   *         An object to be validated.
   * @return {boolean}
   *         True is the coordinate is valid. Otherwise; false.
   */
  static isValidADMCoordinate(coordinate) {
    return this.isValidADMPolarCoordinate(coordinate) ||
      this.isValidADMCartesianCoordinate(coordinate);
  }

  /**
   * Converts and ADM Cartesian to an ADM polar coordinate.
   * @param  {!Object} coordinate
   *         ADM Cartesian coordinate to be converted.
   * @return {Object}
   *         The converted ADM polar coordinate.
   */
  static convertADMCartesianToADMPolar(coordinate) {
    const { x, y, z } = coordinate;
    const vector = new Vector3(x, y, z);
    const d = vector.length();

    vector.normalize();
    const az = x === 0 && y === 0 ? 0 :
      Math.atan2(-vector.x, vector.y) * 180.0 / Math.PI;
    const el = Math.asin(vector.z) * 180.0 / Math.PI;

    return { polar: true, az, el, d };
  }

  /**
   * Converts and ADM polar to an ADM Cartesian coordinate.
   * @param  {!Object} coordinate
   *         ADM polar coordinate to be converted.
   * @return {Object}
   *         The converted ADM Cartesian coordinate.
   */
  static convertADMPolarToADMCartesian(coordinate) {
    const { az, el, d } = coordinate;
    const azRadians = az * Math.PI / 180;
    const elRadians = el * Math.PI / 180;

    const x = d * -Math.sin(azRadians) * Math.cos(elRadians);
    const y = d * Math.cos(azRadians) * Math.cos(elRadians);
    const z = d * Math.sin(elRadians);

    return { polar: false, x, y, z };
  }

  /**
   * Converts and ADM coordinate to the Cartesian representation.
   * @param  {!Object} coordinate
   *         ADM coordinate to be converted.
   * @return {Object}
   *         The ADM coordinate in Cartesian representation.
   */
  static convertToADMPolar(coordinate) {
    return coordinate.polar === true ? coordinate :
      this.convertADMCartesianToADMPolar(coordinate);
  }

  /**
   * Converts and ADM coordinate to the polar representation.
   * @param  {!Object} coordinate
   *         ADM coordinate to be converted.
   * @return {Object}
   *         The ADM coordinate in polar representation.
   */
  static convertToADMCartesian(coordinate) {
    return coordinate.polar === false ? coordinate :
      this.convertADMPolarToADMCartesian(coordinate);
  }
}
