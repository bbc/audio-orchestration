/* global AudioWorkletNode*/
import CompoundNode from '../core/compound-node';

export default class LoudnessMeterWorklet extends CompoundNode {
  /**
   * Constructs a new {@link RmsMeterWorklet}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the {@link RmsMeterWorklet}.
   */
  constructor(context) {
    super(context);
    this._lufs = 0;
    this._spl = 0;
  }

  construct() {
    return new Promise(
      (resolve) => {
        this.context.audioWorklet.addModule('./processors/loudness-processor.js').then(() => {
          const _loudnessWorkletNode = new AudioWorkletNode(this.context, 'loudness-processor');
          _loudnessWorkletNode.port.onmessage = function onmessage(event) {
            if (event.data.message === 'spl') {
              this._spl = event.data.value;
            }
            if (event.data.message === 'lufs') {
              this._lufs = event.data.value;
            }
          }.bind(this);
          this.inputs.push(_loudnessWorkletNode);
          this.outputs.push(_loudnessWorkletNode);
          resolve();
        });
      });
  }

  get lufs() {
    return this._lufs;
  }
  get spl() {
    return this._spl;
  }
}
