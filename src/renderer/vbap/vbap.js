import { Matrix3, Vector3 } from 'three';
import CoordinateHelper from '../coordinate-helper';
import quickHull from 'quickhull3d';

/**
 * A class to perform Vector Base Amplitude Panning for an arbitrary setup of
 * multiple loudspeakers. All positions must be in ADM coordinate format.
 * @example
 *  const speakers = [{
 *    channel: 0,
 *    position: {
 *      polar: true,
 *      az: 30,
 *      el: 0,
 *      d: 1,
 *    },
 *    ...
 *  }];
 *
 * const position = {
 *   polar: true,
 *   az: 0,
 *   el: 30,
 *   d: 1,
 * };
 *
 * const vbap = new Vbap(speakers);
 * const speakerGains = vbap.pan(position);
 * @see https://tech.ebu.ch/docs/tech/tech3364.pdf
 * @private
 */
export default class Vbap {
  /**
   * Constructs a new {@link Vbap}.
   * @param  {!Array} speakers
   *         An array of speakers, each with a position defined.
   */
  constructor(speakers) {
    this._validateSpeakersParameter(speakers);
    this._speakers = speakers;
    this._eps = 1e-6;

    // Convert all the speakers to normalised THREE.Vector3.
    this._speakerVectors = this._speakers
      .map((speaker) => this._toNormalisedVector(speaker.position));

    // Construct triangles using quickhull and speaker vectors.
    this._triangles = quickHull(this._speakerVectors
      .map((vector) => vector.toArray()));
  }

  /**
   * Validates a speaker array.
   * @param  {!Array} speakers
   *         An array of speakers, each with a position defined.
   */
  _validateSpeakersParameter(speakers) {
    // Ensure speakers are present and there are enough for triangulation.
    if (!(speakers instanceof Array && speakers.length > 2)) {
      throw Error('Speakers must be an array of more than two speakers.');
    }

    // Ensure speakers all have correct positions defined in ADM format.
    speakers.forEach((speaker, i) => {
      if (!CoordinateHelper.isValidADMCoordinate(speaker.position)) {
        throw Error(`Position of speaker ${i} is an invalid ADM coordinate.`);
      }
    });
  }

  /**
   * Converts an ADM position to a normalised THREE.js Vector3.
   * @param  {!Object} position
   *         An ADM position.
   * @return {Vector3}
   *         A normalised THREE.js Vector3.
   */
  _toNormalisedVector(position) {
    // Convert to ADM Cartesian coordinate system.
    const { x, y, z } = CoordinateHelper.convertToADMCartesian(position);
    // Construct a vector from Cartesian coordinates and normalise.
    const vector = new Vector3(x, y, z);
    return vector.normalize();
  }

  /**
   * Gets the speaker array used to instatiate this class.
   * @type {Array<Object>}
   *       The speaker array used to instatiate this class.
   */
  get speakers() {
    return this._speakers;
  }

  /**
   * Gets the VBAP triangles constructred for the speaker configuration.
   * @type {Array<Array<number>>}
   *       An array of triangles constructred for the speaker configuration.
   *       Triangles are defined by three indexes into the speakers array. The
   *       positions of each speaker define the vertices of the triangle.
   */
  get triangles() {
    return this._triangles;
  }

  /**
   * Calculates the required gains that should be applied to each speaker in
   * order to localise sound output to the passed position.
   * @param  {!Object} position
   *         An ADM position.
   * @return {Array<number>}
   *         An array of gains (numbers in the range 0-1).
   */
  pan(position) {
    // Convert to ADM Cartesian coordinate system.
    const normalisedPosition = this._toNormalisedVector(position);
    const speakerGains = this._speakers.map(() => 0);
    let isFound = false;
    let i = 0;

    while (!isFound && i++ < this._triangles.length) {
      const triangle = this._triangles[i];
      const p1 = this._speakerVectors[triangle[0]];
      const p2 = this._speakerVectors[triangle[1]];
      const p3 = this._speakerVectors[triangle[2]];

      const matrix = new Matrix3();
      const inverse = new Matrix3();
      const triangleGains = new Vector3();

      matrix.set(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
      inverse.getInverse(matrix).transpose();
      triangleGains.copy(normalisedPosition).applyMatrix3(inverse);

      if (triangleGains.x >= -this._eps &&
          triangleGains.y >= -this._eps &&
          triangleGains.z >= -this._eps) {
        // Normalise triangle gains (as gain should be 0-1).
        triangleGains.normalize();
        //  Set gain on corresponding speakers.
        speakerGains[triangle[0]] = triangleGains.x;
        speakerGains[triangle[1]] = triangleGains.y;
        speakerGains[triangle[2]] = triangleGains.z;
        isFound = true;
      }
    }

    // if (!isFound) {
    //   console.warn('No valid triangle found when panning.');
    // }

    // TODO: Acknowledge channels here and set array properly.
    // TODO: Imaginary speaker mix-down.

    return speakerGains;
  }
}
