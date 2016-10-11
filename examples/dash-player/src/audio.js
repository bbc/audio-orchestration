import bbcat from 'bbcat';

import ircamHrtfs from './hrtfs/ircam_hrtfs';
import speakers5plus0 from './speakers/5+0_speakers';

export const renderTypes = [{
  title: 'Stereo',
  desc: 'WAA Equal Power',
  factory: bbcat.renderer.EqualPowerChannelHandler.createFactory(),
}, {
  title: 'Binaural',
  desc: 'WAA Hrtfs',
  factory: bbcat.renderer.HrtfChannelHandler.createFactory(),
}, {
  title: 'Binaural',
  desc: 'IRCAM Hrtfs',
  factory: bbcat.renderer.IrcamFirChannelHandler.createFactory(ircamHrtfs),
}, {
  title: 'BVS',
  desc: '5+0 to WAA Hrtfs',
  factory: bbcat.renderer.BvsChannelHandler.createFactory(speakers5plus0,
    bbcat.renderer.HrtfChannelHandler.createFactory()),
}];

export default class DashAudio {
  constructor(context) {
    this._context = context;
    this._manifestLoader = new bbcat.dash.ManifestLoader();
    this._manifestParser = new bbcat.dash.ManifestParser();

    bbcat.renderer.HrtfHelper.populateBuffers(ircamHrtfs, context);

    this._manifest = null;
    this._renderType = null;

    this._dashSourceNode = null;
    this._rendererNode = null;
    this._syncTime = null;
  }

  _setupAudioGraph() {
    // Teardown any existing graph nodes.
    if (this._rendererNode !== null && this._dashSourceNode !== null) {
      this._rendererNode.stop();
      this._dashSourceNode.stop();

      this._rendererNode.disconnect(this._context.destination);
      this._dashSourceNode.outputs.forEach((output, i) => {
        output.disconnect(this._rendererNode.inputs[i]);
      });

      this._rendererNode = null;
      this._dashSourceNode = null;
    }

    if (this._manifest && this._renderType) {
      this._dashSourceNode = new bbcat.dash.DashSourceNode(
        this._context, this._manifest);
      this._rendererNode = new bbcat.renderer.RendererNode(this._context,
        this._dashSourceNode.outputs.length, this._renderType.factory);

      this._dashSourceNode.addEventListener('metadata', (e) => {
        this._rendererNode.addMetaData(e.metadata);
      });

      this._context.destination.channelCount =
      this._rendererNode.outputs[0].channelCount;
      this._context.destination.channelCountMode = 'explicit';
      this._context.destination.channelInterpretation = 'discrete';

      this._rendererNode.connect(this._context.destination);
      this._dashSourceNode.outputs.forEach((output, i) => {
        output.connect(this._rendererNode.inputs[i]);
      });
    }
  }

  play(initial = 0) {
    return this._dashSourceNode.prime(initial).then(() => {
      this._syncTime = this._context.currentTime;
      this._dashSourceNode.start(this._syncTime);
      this._rendererNode.start(this._syncTime);
    });
  }

  pause() {
    this._dashSourceNode.stop();
    this._rendererNode.stop();
  }

  set manifestUrl(manifestUrl) {
    return this._manifestLoader
      .load(manifestUrl)
      .then((manifestBlob) => this._manifestParser.parse(manifestBlob))
      .then((manifest) => {
        this._manifest = manifest;
        this._setupAudioGraph();
      });
  }

  get manifestUrl() {
    return this._manifestUrl;
  }

  set renderType(renderType) {
    this._renderType = renderType;
    this._setupAudioGraph();
  }

  get renderType() {
    return this._renderType.title;
  }

  get current() {
    return this._dashSourceNode ? this._dashSourceNode.playbackTime : 0;
  }

  get duration() {
    return this._dashSourceNode ? this._dashSourceNode.presentationDuration : 0;
  }

  get state() {
    return this._dashSourceNode ? this._dashSourceNode.state : 'waiting';
  }

  get channelConfigurations() {
    return this._rendererNode ? this._rendererNode.channelConfigurations : [];
  }
}
