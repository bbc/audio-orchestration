import SpatialiserFilterSelector from
  './../../../../src/renderer/binaural/spatialiser-channel-handler/spatialiser-filter-selector';
import SpatialiserChannelHandler from
  './../../../../src/renderer/binaural/spatialiser-channel-handler/spatialiser-channel-handler';
import ChannelHandler from './../../../../src/renderer/channel-handler';
import HrtfGenerator from './../../hrtf-generator';
import MockAudioContext from './../../../mock-audio-context';
import coordinates from './../../coordinates';

describe('SpatialiserChannelHandler', () => {
  beforeAll(() => {
    jasmine.clock().install();
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  it('should extend ChannelHandler', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
    const context = MockAudioContext.createAudioContext();
    const filterSelector = new SpatialiserFilterSelector(hrtfs);
    const channelHandler = new SpatialiserChannelHandler(
      context, { filterSelector });

    expect(channelHandler).toEqual(jasmine.any(ChannelHandler));
  });

  it('should expose a static factory function', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
    const context = MockAudioContext.createAudioContext();
    const channelHandlerFactory =
      SpatialiserChannelHandler.createFactory(hrtfs);
    const channelHandler = channelHandlerFactory(context);

    expect(channelHandlerFactory).toEqual(jasmine.any(Function));
    expect(channelHandler).toEqual(jasmine.any(SpatialiserChannelHandler));
  });

  it('should correctly set gain', (done) => {
    // Should be initialised to a gain of 1.
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
    const context = MockAudioContext.createAudioContext();
    const sourceNode = context.createOscillator();
    const filterSelector = new SpatialiserFilterSelector(hrtfs);
    const channelHandler = new SpatialiserChannelHandler(
      context, { filterSelector });
    channelHandler.output.connect(context.destination);
    sourceNode.connect(channelHandler.input);
    sourceNode.start();
    expect(channelHandler.gain).toEqual(1);

    // Check gain can be set with a delay.
    channelHandler.setGain(0.50, context.currentTime + 1);
    // Check gain change has not yet been set.
    expect(channelHandler.gain).toEqual(1);
    // Action rendering and then check position has been set.
    context.startRendering();
    context.oncomplete = () => {
      // TODO: Uncomment this when bug is fixed in Firefox.
      // expect(channelHandler.gain).toEqual(0.50);
      done();
    };
  });

  it('should correctly set position', () => {
    // Should be initialised to a position of { x: 0, y: 0, z: 0 }.
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
    const context = MockAudioContext.createAudioContext();
    const filterSelector = new SpatialiserFilterSelector(hrtfs);
    const channelHandler = new SpatialiserChannelHandler(
      context, { filterSelector });
    expect(channelHandler.position.x).toEqual(0);
    expect(channelHandler.position.y).toEqual(0);
    expect(channelHandler.position.z).toEqual(0);

    // Check position can be set without delay.
    channelHandler.setPosition({ polar: false, x: 1, y: 2, z: 3 }, 0);
    expect(channelHandler.position.x).toEqual(1);
    expect(channelHandler.position.y).toEqual(2);
    expect(channelHandler.position.z).toEqual(3);

    // Check position can be set with a delay.
    channelHandler.setPosition({ polar: false, x: 4, y: 5, z: 6 }, 2);
    // Check position change has not yet been set.
    expect(channelHandler.position.x).toEqual(1);
    expect(channelHandler.position.y).toEqual(2);
    expect(channelHandler.position.z).toEqual(3);
    // Action clock ticks and then check position has been set.
    context.currentTime = 2;
    jasmine.clock().tick(2 * 1000);
    expect(channelHandler.position.x).toEqual(4);
    expect(channelHandler.position.y).toEqual(5);
    expect(channelHandler.position.z).toEqual(6);
  });

  it('should set position for both polar and Cartesian coordinates', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
    const context = MockAudioContext.createAudioContext();
    const filterSelector = new SpatialiserFilterSelector(hrtfs);
    const channelHandler = new SpatialiserChannelHandler(
      context, { filterSelector });

    // Test for all valid test coordinates in Cartesian form.
    coordinates.valid.forEach((coordinate) => {
      channelHandler.setPosition(coordinate.cartesian, 0);
      expect(channelHandler.position.x).toBeCloseTo(coordinate.cartesian.x, 10);
      expect(channelHandler.position.y).toBeCloseTo(coordinate.cartesian.y, 10);
      expect(channelHandler.position.z).toBeCloseTo(coordinate.cartesian.z, 10);
    });

    // Test for all valid test coordinates in polar form.
    coordinates.valid.forEach((coordinate) => {
      channelHandler.setPosition(coordinate.polar, 0);
      expect(channelHandler.position.x).toBeCloseTo(coordinate.cartesian.x, 10);
      expect(channelHandler.position.y).toBeCloseTo(coordinate.cartesian.y, 10);
      expect(channelHandler.position.z).toBeCloseTo(coordinate.cartesian.z, 10);
    });
  });
});
