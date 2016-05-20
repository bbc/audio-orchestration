import ChannelHandler from './../../src/renderer/channel-handler';
import MockAudioContext from './../mock-audio-context';

describe('ChannelHandler', () => {
  it('should correctly construct', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandler = new ChannelHandler(context);
    expect(channelHandler).toBeDefined();
  });

  it('should expose read only input', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandler = new ChannelHandler(context);

    expect(channelHandler.input).toBeDefined();
    expect(() => { channelHandler.input = null; }).toThrowError(TypeError);
  });

  it('should expose read only output', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandler = new ChannelHandler(context);

    expect(channelHandler.output).toBeDefined();
    expect(() => { channelHandler.output = null; }).toThrowError(TypeError);
  });

  it('should expose read only gain', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandler = new ChannelHandler(context);

    expect(channelHandler.gain).toBeDefined();
    expect(() => { channelHandler.gain = null; }).toThrowError(TypeError);
  });

  it('should correctly default gain', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandler = new ChannelHandler(context);

    expect(channelHandler.gain).toBe(1);
  });

  it('should expose read only position', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandler = new ChannelHandler(context);

    expect(channelHandler.position).toBeDefined();
    expect(() => { channelHandler.position = null; }).toThrowError(TypeError);
  });

  it('should correctly default position', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandler = new ChannelHandler(context);

    expect(channelHandler.position.x).toEqual(0);
    expect(channelHandler.position.y).toEqual(0);
    expect(channelHandler.position.z).toEqual(0);
  });
});
