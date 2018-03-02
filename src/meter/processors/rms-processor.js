/* global AudioWorkletProcessor registerProcessor*/
class RmsProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super(options);
    this._rmsValue = 0;
  }

  process(inputs) {
    // this is a single stereo input node (all other inputs are ignored)
    const input = inputs[0];
    const inputL = input[0];
    const inputR = input[0];
    let sumOfSquares = 0;
    for (let i = 0; i < inputL.length; i++) {
      sumOfSquares += Math.pow(inputL[i] + inputR[i] / inputL.length, 2);
    }
    const rootMean = Math.sqrt(sumOfSquares / inputL.length);
    this._rmsValue = this._smooth(this._rmsValue, rootMean, 0.98);
    this._sendRMS(this._rmsValue);
    return true;
  }
  /**
   * Smoothes the transition between two values using a smothing coefficient.
   * @param  {!number} previousValue
   *         The value to transition from.
   * @param  {!number} targetValue
   *         The value to transition to.
   * @param  {!number} alpha
   *         The coefficient of smoothing.
   * @return {number}
   *         The smoothed value.
   */
  _smooth(previousValue, targetValue, alpha) {
    return (alpha * previousValue + (1 - alpha) * targetValue);
  }

  _sendRMS(value) {
    this.port.postMessage({
      message: 'rmsupdate',
      value,
    });
  }

}

registerProcessor('rms-processor', RmsProcessor);
