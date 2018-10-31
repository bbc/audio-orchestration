/* global AudioWorkletNode*/
import CompoundNode from '../core/compound-node';
/**
 * A class to measure the RMS a connected stereo signal. Note that the input is
 * mixed to mono, and will give inappropriate results for signals with strong
 * out-of-phase components in left and right.
 * Note: This version uses the AudioWorklet rather than the depricated ScriptProcessor
 * @extends {CompoundNode}
 * @example
 * const context = new AudioContext();
 * const source = context.createBufferSource();
 * const rmsMeter = new bbcat.meter.RmsMeterWorklet(context);
 *
 * new bbcat.core.AudioLoader(context)
 * .load('./some/example/audio.mp4')
 * .then((audio) => {
 *   source.buffer = audio;
 *   source.start(0);
 * });
 *
 * source.connect(context.destination);
 * source.connect(rmsMeter.input);
 *
 * // Log the RMS value to the console every second.
 * setInterval(() => { console.log(rmsMeter.rms); }, 1000));
 */
export default class RmsMeterWorklet extends CompoundNode {
  /**
   * Constructs a new {@link RmsMeterWorklet}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the {@link RmsMeterWorklet}.
   */
  constructor(context) {
    super(context);
    this._rmsValue = 0;
  }

  construct() {
    return new Promise(
      (resolve) => {
        this.context.audioWorklet.addModule('./processors/rms-processor.js').then(() => {
          const _rmsWorkletNode = new AudioWorkletNode(this.context, 'rms-processor');
          _rmsWorkletNode.port.onmessage = function onmessage(event) {
            if (event.data.message === 'rmsupdate') {
              this._rmsValue = event.data.value;
            }
          }.bind(this);
          this.inputs.push(_rmsWorkletNode);
          this.outputs.push(_rmsWorkletNode);
          resolve();
        });
      });
  }
  /**
   * Returns the RMS measure.
   * @type   {number}
   *         The RMS measure.
   */
  get rms() {
    return this._rmsValue;
  }
}
