import CompoundNode from '../core/compound-node';
import FOARotator from './foa-rotator';
import { mat3, quat } from 'gl-matrix';

/**
 * A class to render a first-order Ambisonics signal to a binaural signal.
 * Loads impulse responses for direct convolution with Ambisonics signals,
 * i.e. rather than performing decoding explicitly, the filters implicitly
 * mix HRIRs using a decoding matrix. The renderer can apply a rotation via
 * a quaternion (using the WebGL/graphical coordinate system).
 *
 * @example
 * const AudioContext = window.AudioContext || window.webkitAudioContext;
 * const context = new AudioContext();
 * const filters = loadImpulseResponsesFromSomewhere();
 *
 * const renderer = new FOABinaural(context, filters);
 * someSourceNode.connect(renderer.inputs[0]);
 * @public
 */
export default class FOABinaural extends CompoundNode {

  /**
   * Constructs a new {@link FOABinaural}.
   * @param  {!AudioContext} context
   *         The AudioContext.
   * @param  {!Array} filters
   *         An array containing filter objects, importantly
   *         each having a property buffer of type AudioBuffer.
   */
  constructor(context, filters) {
    super(context);
    this._numberOfChannels = 4;
    this._filters = filters; // initially assume array of 4 stereo buffers
    this._initAudioGraph();

    this._rotationQuaternion = quat.create();
    this._rotationMatrix = mat3.create();
  }

  /**
   * Initialises the graph of audio nodes.
   */
  _initAudioGraph() {

    const inGainNode = this.context.createGain();
    this._inputs.push(inGainNode);
    const outGainNode = this.context.createGain();
    this._outputs.push(outGainNode);
    this._rotator = new FOARotator(this.context);
    this._splitter = this.context.createChannelSplitter(this._numberOfChannels);

    inGainNode.connect(this._rotator.inputs[0]);
    this._rotator.connect(this._splitter);

    this._convolvers = [];
    for (let i = 0; i < this._numberOfChannels; i++) {
      this._convolvers.push(this.context.createConvolver());
      this._convolvers[i].buffer = this._filters[i].buffer;
      this._convolvers[i].normalize = false;
      this._splitter.connect(this._convolvers[i], i);
      this._convolvers[i].connect(outGainNode);
    }
  }

  /**
   * Sets the listener pose and rotates the audio using the inverse transform.
   * @param  {!Float32Array} poseQuaternion
   *         The pose transform as a quaternion (e.g. gl-matrix.quat).
   *         This should be in the WebGL/graphics coordinate system i.e.
   *         x = forward, y = up, z = backwards/outwards
   */
  setTransform(poseQuaternion) {
    quat.invert(this._rotationQuaternion, poseQuaternion);
    mat3.fromQuat(this._rotationMatrix, this._rotationQuaternion);
    this._rotator.setRotationMatrix(this._rotationMatrix);
  }
};
