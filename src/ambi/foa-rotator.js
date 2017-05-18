import CompoundNode from '../core/compound-node';

/**
 * A class to rotate a first-order Ambisonics signal using Web Audio.
 *
 * @example
 * const AudioContext = window.AudioContext || window.webkitAudioContext;
 * const context = new AudioContext();
 * const source = generateAmbisonicsSourceFromSomewhere();
 * const dest = generateAmbisonicsDecoderFromSomewhere();
 *
 * const rotator = new FOARotator(context);
 * source.connect(rotator.inputs[0]);
 * rotator.connect(dest);
 *
 * const rotationMatrix = generateRotationMatrixFromSomewhere();
 * rotator.setRotationMatrix(rotationMatrix);
 *
 * @public
 */
export default class FOARotator extends CompoundNode {

  /**
   * Constructs a new {@link FOARotator}.
   * @param  {!AudioContext} context
   *         The AudioContext.
   */
  constructor(context) {
    super(context);

    this._numberOfChannels = 4;

    this._initAudioGraph();
    this.setRotationMatrix(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
  }

  /**
   * Initialises the required AudioNodes.
   */
  _initAudioGraph() {

    // channel split/merge nodes
    this._splitter = this.context.createChannelSplitter(this._numberOfChannels);
    this._merger   = this.context.createChannelMerger(this._numberOfChannels);
    this._inputs.push(this._splitter);
    this._outputs.push(this._merger);

    // | a1(Y) |   | r0  r3  r6 |   | a1*r0 + a2*r3 + a3*r6 |   | a1r |
    // | a2(Z) | * | r1  r4  r7 | = | a1*r1 + a2*r4 + a3*r7 | = | a2r |
    // | a3(X) |   | r2  r5  r8 |   | a1*r2 + a2*r5 + a3*r8 |   | a3r |
    this._rotationMatrixGains = [];
    for (let i = 0; i < 9; i++) {
      this._rotationMatrixGains.push(this.context.createGain());
    }
    this._splitter.connect(this._merger, 0, 0); // pass through w
    this._splitter.connect(this._rotationMatrixGains[0],1); // a1 to r0
    this._splitter.connect(this._rotationMatrixGains[1],1); // a1 to r1
    this._splitter.connect(this._rotationMatrixGains[2],1); // a1 to r2
    this._splitter.connect(this._rotationMatrixGains[3],2); // a2 to r3
    this._splitter.connect(this._rotationMatrixGains[4],2); // a2 to r4
    this._splitter.connect(this._rotationMatrixGains[5],2); // a2 to r5
    this._splitter.connect(this._rotationMatrixGains[6],3); // a3 to r6
    this._splitter.connect(this._rotationMatrixGains[7],3); // a3 to r7
    this._splitter.connect(this._rotationMatrixGains[8],3); // a3 to r8

    this._rotationMatrixGains[0].connect(this._merger, 0, 1); // r0 to a1r
    this._rotationMatrixGains[1].connect(this._merger, 0, 2); // r1 to a2r
    this._rotationMatrixGains[2].connect(this._merger, 0, 3); // r2 to a3r
    this._rotationMatrixGains[3].connect(this._merger, 0, 1); // r3 to a1r
    this._rotationMatrixGains[4].connect(this._merger, 0, 2); // r4 to a2r
    this._rotationMatrixGains[5].connect(this._merger, 0, 3); // r5 to a3r
    this._rotationMatrixGains[6].connect(this._merger, 0, 1); // r6 to a1r
    this._rotationMatrixGains[7].connect(this._merger, 0, 2); // r7 to a2r
    this._rotationMatrixGains[8].connect(this._merger, 0, 3); // r8 to a3r
  }

  /**
   * Returns the rotation transform as a 3x3 matrix.
   * @param  {!Float32Array} matrix
   *         The 3x3 rotation matrix (e.g. gl-matrix.mat3).
   *         In the WebGL/graphics coordinate system i.e.
   *         x = forward, y = up, z = backwards/outwards
   */
  get rotationMatrix() {
    return this._rotationMatrix;
  }

  /**
   * Sets the rotation transform as a 3x3 matrix.
   * @param  {!Float32Array} matrix
   *         The 3x3 rotation matrix (e.g. gl-matrix.mat3).
   *         This should be in the WebGL/graphics coordinate system i.e.
   *         x = forward, y = up, z = backwards/outwards
   */
  setRotationMatrix(matrix) {
    this._rotationMatrix = matrix;

    // conveniently the WebGL coordinate space maps to ACN channel order (Y,Z,X)
    // GL.X = -AmbiX.Y (right)
    // GL.Y =  AmbiX.Z (up)
    // GL.Z = -Ambix.X (back/out)
    // so we just need to invert the X and Y coefficients

    // rely on dezippering in gain node rather than a ramp
    this._rotationMatrixGains[0].gain.value =-this._rotationMatrix[0];
    this._rotationMatrixGains[1].gain.value =-this._rotationMatrix[1];
    this._rotationMatrixGains[2].gain.value =-this._rotationMatrix[2];
    this._rotationMatrixGains[3].gain.value = this._rotationMatrix[3];
    this._rotationMatrixGains[4].gain.value = this._rotationMatrix[4];
    this._rotationMatrixGains[5].gain.value = this._rotationMatrix[5];
    this._rotationMatrixGains[6].gain.value =-this._rotationMatrix[6];
    this._rotationMatrixGains[7].gain.value =-this._rotationMatrix[7];
    this._rotationMatrixGains[8].gain.value =-this._rotationMatrix[8];
  }
};