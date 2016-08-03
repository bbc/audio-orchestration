import CompoundNode from '../core/compound-node';
import { Quaternion } from 'three';

/**
 * An AudioNode to perform object-based rendering from audio and metadata
 * streams. Metadata must be provided in ADM format.
 * @see https://tech.ebu.ch/docs/tech/tech3364.pdf
 * @public
 * @extends {CompoundNode}
 * @example
 * const manifestLoader = new bbcat.dash.ManifestLoader();
 * const manifestParser = new bbcat.dash.ManifestParser();
 *
 * manifestLoader.load('url/to/manifest.mpd')
 *   .then((manifestBlob) => {
 *     // Parse the manifest blob to a manifest object.
 *     const manifest = manifestParser.parse(manifestBlob);
 *
 *     // Create audio nodes.
 *     const context = new AudioContext();
 *     const dashSourceNode = new bbcat.dash.DashSourceNode(context, manifest);
 *     const stereoRendererNode = new bbcat.renderer.createStereoRenderer(
 *       context, dashSourceNode.outputs.length);
 *
 *     // Connect nodes.
 *     stereoRendererNode.connect(context.destination);
 *     for (let i = 0; i < dashSourceNode.outputs.length; i++) {
 *       dashSourceNode.connect(stereoRendererNode, i, i);
 *     }
 *
 *     // Pass metadata from the DashSourceNode to the RendererNode.
 *     dashSourceNode.addEventListener('metadata', function (e) {
 *       stereoRendererNode.addMetaData(e.metadata);
 *     });
 *
 *     // Start playback and rendering synced to the same context time.
 *     const contextSyncTime = context.currentTime;
 *     dashSourceNode.prime().then(() => {
 *       dashSourceNode.start(contextSyncTime);
 *       stereoRendererNode.start(contextSyncTime);
 *     });
 *   })
 *   .catch((error) => {
 *     console.log(error);
 *   });
 */
export default class RendererNode extends CompoundNode {
  /**
   * Constructs a new {@link RendererNode}.
   * @param  {!AudioContext} context
   *         The AudioContext that rendering will be synchronised to.
   * @param  {!number} numberOfInputs
   *         The number of different inputs the node should accept.
   * @param  {!function()} channelHandlerFactory
   *         A function that accepts an AudioContext as it's first parameters
   *         and returns a ChannelHandler.
   */
  constructor(context, numberOfInputs, channelHandlerFactory) {
    super(context);

    // TODO: Validate inputs.

    // Set the listener orientation to that of the ADM coordinate system.
    this.context.listener.setOrientation(0, 1, 0, 0, 0, 1);

    this._numberOfInputs = numberOfInputs;
    this._channelHandlerFactory = channelHandlerFactory;

    this._renderIntervalFunction = null;
    this._renderInterval = 20; // Milliseconds.
    this._renderAhead = 150 * 1e6; // Nanoseconds.

    this._metadataQueue = [];
    this._channelHandlers = [];
    this._contextSyncTime = 0;

    this._transform = new Quaternion()

    this._initAudioGraph();
  }

  /**
   * Gets the position and gain of all rendered channels.
   * @public
   * @type {Array<{position: Object, gain: number}>}
   *       An array of configuration objects.
   */
  get channelConfigurations() {
    return this._channelHandlers.map((channel) => {
      const { position, gain } = channel;
      return { position, gain };
    });
  }

  /**
   * Initialises the required AudioNodes.
   */
  _initAudioGraph() {
    const gainNode = this._context.createGain();
    this._outputs.push(gainNode);

    for (let i = 0; i < this._numberOfInputs; i++) {
      const channelHandler = this._channelHandlerFactory(this.context);
      this._channelHandlers.push(channelHandler);
      this._inputs.push(channelHandler.input);
      channelHandler.output.connect(gainNode);
    }
  }

  /**
   * Checks if there is metadata that is soon to be handled in the queue.
   * If so; handles the metadata.
   */
  _render() {
    // Calculate the cutoff for metadata that should be handled now.
    const lookAhead = 1e9 * this._getCurrentSyncTime() + this._renderAhead;

    // While there is metadata due before this cutoff; remove metadata from the
    // queue and handle it.
    while (this._metadataQueue[0] &&
      this._metadataQueue[0].timens <= lookAhead) {
      this._handleMetadataEvent(this._metadataQueue[0]);
      this._metadataQueue.shift();
    }
  }

  /**
   * Returns the number of seconds past since the sync point.
   * @return {number}
   *         The number of seconds past since the sync point.
   */
  _getCurrentSyncTime() {
    return this._context.currentTime - this._contextSyncTime;
  }

  /**
   * Handles a single ADM metadata event.
   * @param  {!Object} event
   *         The ADM metadata event to handle.
   */
  _handleMetadataEvent(event) {
    // If the event channel is valid, handle it.
    const channel = event.channel;
    if (channel < this._channelHandlers.length) {
      const channelHandler = this._channelHandlers[channel];
      // const { gain, position, diffuseness, dialogue } = event.parameters;
      const { gain, position } = event.parameters;
      const time = 1e-9 * event.timens + this._contextSyncTime;

      if (gain) {
        channelHandler.setGain(gain, time);
      }
      if (position) {
        channelHandler.setPosition(position, time);
      }
      // Not yet implemented.
      // if (diffuseness) {
      //   channelHandler.setDiffuseness(diffuseness, time);
      // }
      // if (dialogue) {
      //   channelHandler.setDialogue(dialogue, time);
      // }
    }
  }

  /**
   * Starts rendering of the input audio, synchronised with AudioContext.
   * @param  {?number} [contextSyncTime=context.currentTime]
   *         The context time to synchronise with.
   */
  start(contextSyncTime = this._context.currentTime) {
    // Buffer the sync time and start the rendering routine.
    this._contextSyncTime = contextSyncTime;
    this._renderIntervalFunction = setInterval(
      () => this._render(), this._renderInterval);
    this._render();
  }

  /**
   * Stops rendering of the input audio.
   */
  stop() {
    // Stop the rendering routine.
    clearInterval(this._renderIntervalFunction);
    this._metadataQueue = [];
  }

  /**
   * Adds ADM metadata to be rendered.
   * @param  {!Array<Object>} metadata
   *         An array of ADM metadata objects.
   */
  addMetaData(metadata) {
    // If there is metadata; shuffle in to the queue. Only the block is shuffled
    // in rather than each individual item of metadata. As such, blocks may be
    // out of order. Individual items of metadata within those blocks may not.
    if (metadata instanceof Array && metadata.length > 0) {
      let i = 0;
      while (i < this._metadataQueue.length &&
        this._metadataQueue[i].timens < metadata[0].timens) {
        i++;
      }

      const args = [i, 0].concat(metadata);
      Array.prototype.splice.apply(this._metadataQueue, args);
    }
  }
  
  /**
   * Sets the listener transform.
   * @param  {!Float32Array} transform
   *         Transform quaternion as a Float32Array[4] (x,y,z,w).
   */
  setTransform(transform) {
    const t = new Quaternion(transform[0], transform[1], transform[2], transform[3]);
    t.normalize(); // normalize to ensure rotation (especially important due to single to double conversion)
    const look = new Vector3(0, 1, 0);
    const up   = new Vector3(0, 0, 1);
    look.applyQuaternion(t);
    up.applyQuaternion(t);
    this.context.listener.setOrientation(look.x, look.y, look.z, up.x, up.y, up.z);

    this._transform.copy(t.inverse());

    this._channelHandlers.forEach((channelHandler) => {
      channelHandler.setTransform(this._transform);
    });
  }
}