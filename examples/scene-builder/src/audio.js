import bbcat from 'bbcat';

import ircamHrtfs from './hrtfs/ircam_hrtfs';
import speakers5plus0 from './speakers/5+0_speakers';

// export const channelHandlers = [{
//   key: 'waaEqualPower',
//   title: 'WAA Equal Power',
//   factory: bbcat.renderer.EqualPowerChannelHandler.createFactory(),
// }, {
//   key: 'waaHrtf',
//   title: 'WAA HRTF',
//   factory: bbcat.renderer.HrtfChannelHandler.createFactory(),
// }];

export const channelHandlers = [{
  title: 'Stereo',
  desc: 'WAA Equal Power',
  key: 'WAAEqualPower',
  factory: bbcat.renderer.EqualPowerChannelHandler.createFactory(),
}, {
  title: 'Binaural',
  desc: 'WAA Hrtfs',
  key: 'WAAHrtf',
  factory: bbcat.renderer.HrtfChannelHandler.createFactory(),
}, {
  title: 'Binaural',
  desc: 'IRCAM Hrtfs',
  key: 'IRCAMHrtf',
  factory: bbcat.renderer.IrcamFirChannelHandler.createFactory(ircamHrtfs),
}, {
  title: 'BVS',
  desc: '5+0 to WAA Hrtfs',
  key: 'BVS5+0towWAAHrtf',
  factory: bbcat.renderer.BvsChannelHandler.createFactory(speakers5plus0,
    bbcat.renderer.HrtfChannelHandler.createFactory()),
}];

export default class AudioGraph {
  constructor(channelHandlerFactory) {
    this._context = new AudioContext();
    bbcat.renderer.HrtfHelper.populateBuffers(ircamHrtfs, this._context);
    this._channelHandlerFactory = channelHandlerFactory ||
      channelHandlers[0].factory;
    this._loader = new bbcat.core.AudioLoader(this._context);
    this._channels = [];
  }

  _addChannel(config) {
    const channel = {
      id: config.id,
      position: { az: 0, el: 0, d: 0 },
      handler: this._channelHandlerFactory(this._context),
    };

    this._setChannelGain(channel, config.gain);
    this._setChannelAzimuth(channel, config.azimuth);
    this._setChannelElevation(channel, config.elevation);
    this._setChannelDistance(channel, config.distance);
    this._setChannelUrl(channel, config.url);

    this._channels.push(channel);
    return channel;
  }

  _removeChannel(id) {
    const channelIdx = this._channels.findIndex(c => c.id === id);
    const channel = this._channels.splice(channelIdx, 1)[0];

    if (channel.buffer) {
      channel.buffer.stop();
      channel.buffer.disconnect(channel.handler.input);
      channel.handler.output.disconnect(this._context.destination);
    }
  }

  _getChannelById(id) {
    return this._channels.find(c => c.id === id);
  }

  _setChannelGain(channel, gain) {
    // eslint-disable-next-line no-param-reassign
    channel.gain = gain;
    channel.handler.setGain(gain, this._context.currentTime);
  }

  _setChannelAzimuth(channel, azimuth) {
    // eslint-disable-next-line no-param-reassign
    channel.position.az = azimuth;
    channel.handler.setPosition(channel.position, this._context.currentTime);
  }

  _setChannelElevation(channel, elevation) {
    // eslint-disable-next-line no-param-reassign
    channel.position.el = elevation;
    channel.handler.setPosition(channel.position, this._context.currentTime);
  }

  _setChannelDistance(channel, distance) {
    // eslint-disable-next-line no-param-reassign
    channel.position.d = distance;
    channel.handler.setPosition(channel.position, this._context.currentTime);
  }

  _setChannelUrl(channel, url) {
    /* eslint-disable no-param-reassign */
    if (channel.buffer) {
      channel.handler.output.disconnect(this._context.destination);
      channel.buffer.disconnect(channel.handler.input);
      channel.buffer.stop();
      channel.buffer = undefined;
    }

    if (url !== null && url !== undefined) {
      this._loader
        .load(url)
        .then((decodedAudio) => {
          channel.buffer = this._context.createBufferSource();
          channel.buffer.buffer = decodedAudio;
          channel.buffer.loop = true;
          channel.buffer.start();
          channel.buffer.connect(channel.handler.input);
          channel.handler.output.connect(this._context.destination);
        })
        // eslint-disable-next-line no-console
        .catch((e) => { console.log(e); });
    }
    /* eslint-enable no-param-reassign */
  }

  _setChannelHandler(channelHandler) {
    const handler = channelHandlers.find(ch => ch.key === channelHandler);
    this._channelHandlerFactory = handler.factory;

    this._channels.forEach((channel) => {
      if (channel.buffer) {
        channel.handler.output.disconnect(this._context.destination);
        channel.buffer.disconnect(channel.handler.input);
      }

      // eslint-disable-next-line no-param-reassign
      channel.handler = this._channelHandlerFactory(this._context);
      channel.handler.setGain(channel.gain, this._context.currentTime);
      channel.handler.setPosition(channel.position, this._context.currentTime);

      if (channel.buffer) {
        channel.buffer.connect(channel.handler.input);
        channel.handler.output.connect(this._context.destination);
      }
    });
  }

  _setChannels(configs) {
    while (this._channels.length > 0) {
      this._removeChannel(this._channels[0].id);
    }
    configs.forEach(this._addChannel.bind(this));
  }

  handle(action) {
    switch (action.type) {
      case 'SET_STATE':
        this._setChannelHandler(action.state.channelHandler);
        this._setChannels(action.state.sources);
        break;
      case 'SET_CHANNEL_HANDLER':
        this._setChannelHandler(action.channelHandler);
        break;
      case 'ADD_SOURCE':
        this._addChannel(action.source);
        break;
      case 'REMOVE_SOURCE':
        this._removeChannel(action.sourceId);
        break;
      case 'SET_SOURCE_GAIN':
        this._setChannelGain(this._getChannelById(action.sourceId), action.gain);
        break;
      case 'SET_SOURCE_AZIMUTH':
        this._setChannelAzimuth(this._getChannelById(action.sourceId), action.azimuth);
        break;
      case 'SET_SOURCE_ELEVATION':
        this._setChannelElevation(this._getChannelById(action.sourceId), action.elevation);
        break;
      case 'SET_SOURCE_DISTANCE':
        this._setChannelDistance(this._getChannelById(action.sourceId), action.distance);
        break;
      case 'SET_SOURCE_URL':
        this._setChannelUrl(this._getChannelById(action.sourceId), action.url);
        break;
      default:
        break;
    }
  }
}
