import RendererNode from './renderer-node';
import EqualPowerChannelHandler from './stereo/equal-power-channel-handler';
import HrtfChannelHandler from './binaural/hrtf-channel-handler';
import IrcamFirChannelHandler from './binaural/ircam-fir-channel-handler';
import SpatialiserChannelHandler from
  './binaural/spatialiser-channel-handler/spatialiser-channel-handler';
import VbapChannelHandler from './vbap/vbap-channel-handler';
import BvsChannelHandler from './vbap/bvs-channel-handler';
import HrtfHelper from './hrtf-helper';

/**
 * Create a stereo renderer.
 * @param  {!AudioContext} context
 *         The AudioContext the renderer should synchronise with.
 * @param  {!number} numberOfInputs
 *         The number of inputs to be rendered.
 * @type   {RendererNode}
 *         A {@link RendererNode} instantiated with an
 *         {@link EqualPowerChannelHandler}.
 */
const createStereoRenderer = (context, numberOfInputs) => {
  const channelHandlerFactory = EqualPowerChannelHandler.createFactory();
  return new RendererNode(context, numberOfInputs, channelHandlerFactory);
};

/**
 * Create a binaural renderer.
 * @param  {!AudioContext} context
 *         The AudioContext the renderer should synchronise with.
 * @param  {!number} numberOfInputs
 *         The number of inputs to be rendered.
 * @param  {!Array} hrtfs
 *         The HRTFs used for binaural rendering.
 * @type   {RendererNode}
 *         A {@link RendererNode} instantiated with an
 *         {@link IrcamFirChannelHandler}.
 */
const createBinauralRenderer = (context, numberOfInputs, hrtfs) => {
  const channelHandlerFactory = SpatialiserChannelHandler.createFactory(hrtfs);
  return new RendererNode(context, numberOfInputs, channelHandlerFactory);
};

/**
 * Create a VBAP renderer.
 * @param  {!AudioContext} context
 *         The AudioContext the renderer should synchronise with.
 * @param  {!number} numberOfInputs
 *         The number of inputs to be rendered.
 * @param  {!Array<Object>} speakers
 *         An array of speaker objects that have position in ADM coordinates.
 * @type   {RendererNode}
 *         A {@link RendererNode} instantiated with a
 *         {@link VbapChannelHandler}.
 */
const createVbapRenderer = (context, numberOfInputs, speakers) => {
  const channelHandlerFactory = VbapChannelHandler.createFactory(speakers);
  return new RendererNode(context, numberOfInputs, channelHandlerFactory);
};

/**
 * Create a VBAP-BVS renderer.
 * @param  {!AudioContext} context
 *         The AudioContext the renderer should synchronise with.
 * @param  {!number} numberOfInputs
 *         The number of inputs to be rendered.
 * @param  {!Array<Object>} speakers
 *         An array of speaker objects that have position in ADM coordinates.
 * @param  {!Array} hrtfs
 *         The HRTFs used for binaural rendering.
 * @type   {RendererNode}
 *         A {@link RendererNode} instantiated with a
 *         {@link BvsChannelHandler}.
 */
const createBvsRenderer = (context, numberOfInputs, speakers, hrtfs) => {
  const ircamFirChannelHandlerFactory =
    IrcamFirChannelHandler.createFactory(hrtfs);
  const bvsChannelHandlerFactory =
    BvsChannelHandler.createFactory(speakers, ircamFirChannelHandlerFactory);
  return new RendererNode(context, numberOfInputs, bvsChannelHandlerFactory);
};

export {
  RendererNode,
  EqualPowerChannelHandler,
  HrtfChannelHandler,
  IrcamFirChannelHandler,
  SpatialiserChannelHandler,
  VbapChannelHandler,
  BvsChannelHandler,
  HrtfHelper,
  createStereoRenderer,
  createBinauralRenderer,
  createVbapRenderer,
  createBvsRenderer,
};
