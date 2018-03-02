import FOARotator from './foa-rotator';
import FOABinaural from './foa-binaural';

/**
 * Create a first-order Ambisonics binaural renderer.
 * @param  {!AudioContext} context
 *         The AudioContext.
 * @param  {!Array} filters
 *         An array containing filter objects, importantly
 *         each having a property buffer of type AudioBuffer.
 * @type   {FOABinaural}
 *         A {@link FOABinaural}.
 */
const createFOABinaural = (context, filters) => new FOABinaural(context, filters);


/**
 * Create a first-order Ambisonics rotator.
 * @param  {!AudioContext} context
 *         The AudioContext.
 * @type   {FOARotator}
 *         A {@link FOARotator}.
 */
const createFOARotator = (context) => new FOARotator(context);


export {
  FOARotator,
  FOABinaural,
  createFOABinaural,
  createFOARotator,
};
