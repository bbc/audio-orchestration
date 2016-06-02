/**
 * A class that provides static methods for manipulating HRTF data.
 * @public
 */
export default class HrtfHelper {
  /**
   * Constructs WebAudioAPI {@link AudioBuffer}s *in-place* from left and right
   * HRTF coeffiecients in an Array for each HRTF of the passed HRTFs Array.
   * @example
   * const hrtfs = [{
   *   azimuth: 0,
   *   distance: 1,
   *   elevation: -40,
   *   fir_coeffs_left: [0.00021427, -0.0038777, 0.001307, ...],
   *   fir_coeffs_right: [0.00021427, -0.0038777, 0.001307, ...],
   * }, {
   *   azimuth: -6,
   *   distance: 1,
   *   elevation: -40,
   *   fir_coeffs_left: [0.0026005, -0.0025651, -0.0030957, ...],
   *   fir_coeffs_right: [-0.00057896, -0.0029811, -0.0023989, ...],
   * }, {
   *   ...
   * }];
   * const context = new window.AudioContext();
   * HrtfHelper.populateBuffers(hrtfs, context);
   *
   * hrtfs.forEach((hrtf) => {
   *   // Use hrtf.buffer...
   * });
   * @param  {!Array<Object>} hrtfs
   *         An Array of HRTFs with seperate left and right coefficients.
   * @param  {!AudioContext} context
   *         An WebAudioAPI {@link audioContext}.
   * @param  {?sampleRate} [sampleRate=context.sampleRate]
   *         The sample rate of the HRTFs impulse responses.
   * @param  {?irLength} [irLength]
   *         The length of the HRTFs impulse responses. If not set the length
   *         will be calculated from the data provided.
   */
  static populateBuffers(
    hrtfs, context, sampleRate = context.sampleRate, irLength = 0) {
    // Disable rule for this function as it modifies HRTFs in-place.
    /* eslint-disable no-param-reassign */
    hrtfs.forEach((hrtf) => {
      const bufferLength = irLength > 0 ? irLength :
        Math.min(hrtf.fir_coeffs_left.length, hrtf.fir_coeffs_right.length);
      const buffer = context.createBuffer(2, bufferLength, sampleRate);
      const bufferChannelLeft = buffer.getChannelData(0);
      const bufferChannelRight = buffer.getChannelData(1);
      for (let j = 0; j < bufferLength; j++) {
        bufferChannelLeft[j] = hrtf.fir_coeffs_left[j];
        bufferChannelRight[j] = hrtf.fir_coeffs_right[j];
      }

      hrtf.buffer = buffer;
    });
    /* eslint-enable no-param-reassign */
  }

  /**
   * Calculate and sets the minimum and median delays *in-place* (minDelay and
   * meanDelay respectively) from the HRTFs separate delay parameters.
   * @example
   * const hrtfs = [{
   *   azimuth: 0,
   *   distance: 1,
   *   elevation: -40,
   *   toas: [15.4, 15.3],
   *   fir_coeffs_left: [0.00021427, -0.0038777, 0.001307, ...],
   *   fir_coeffs_right: [0.00021427, -0.0038777, 0.001307, ...],
   * }, {
   *   azimuth: -6,
   *   distance: 1,
   *   elevation: -40,
   *   toas: [12.6, 12.3],
   *   fir_coeffs_left: [0.0026005, -0.0025651, -0.0030957, ...],
   *   fir_coeffs_right: [-0.00057896, -0.0029811, -0.0023989, ...],
   * }, {
   *   ...
   * }];
   * HrtfHelper.populateDelayAggregates(hrtfs);
   * // Use hrtf.minDelay or hrtf.meanDelay...
   * @param  {!Array<Object>} hrtfs
   *         An Array of HRTFs with seperate separate delay parameters (toas).
   */
  static populateDelayAggregates(hrtfs) {
    // Disable rule for this function as it modifies HRTFs in-place.
    /* eslint-disable no-param-reassign */
    let minDelay = Infinity;
    let totalDelay = 0;

    hrtfs.forEach((hrtf) => {
      totalDelay += hrtf.toas[0] + hrtf.toas[1];
      minDelay = Math.min(minDelay, hrtf.toas[0], hrtf.toas[1]);
    });

    hrtfs.meanDelay = totalDelay / (2 * hrtfs.length);
    hrtfs.minDelay = minDelay;
    /* eslint-enable no-param-reassign */
  }
}
