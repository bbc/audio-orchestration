import VbapChannelHandler from './../../../src/renderer/vbap/vbap-channel-handler';
import ChannelHandler from './../../../src/renderer/channel-handler';
import MockAudioContext from './../../mock-audio-context';
import coordinates from '../coordinates';
import speakerConfigurations from '../speaker-configurations';
import { Vector3, Quaternion } from 'three';

describe('VbapChannelHandler', () => {
  beforeAll(() => {
    jasmine.clock().install();
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  it('should extend ChannelHandler', () => {
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    const channelHandler = new VbapChannelHandler(context, { speakers });

    expect(channelHandler).toEqual(jasmine.any(ChannelHandler));
  });

  it('should expose a static factory function', () => {
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    const channelHandlerFactory = VbapChannelHandler.createFactory(speakers);
    const channelHandler = channelHandlerFactory(context);

    expect(channelHandlerFactory).toEqual(jasmine.any(Function));
    expect(channelHandler).toEqual(jasmine.any(VbapChannelHandler));
  });

  it('should correctly set gain', (done) => {
    // Should be initialised to a gain of 1.
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    const sourceNode = context.createOscillator();
    const channelHandler = new VbapChannelHandler(context, { speakers });
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
      // expect(channelHandler.gain).toEqual(0.50);
      done();
    };
  });

  it('should correctly set position', () => {
    // Should be initialised to a position of { x: 0, y: 0, z: 0 }.
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    const channelHandler = new VbapChannelHandler(context, { speakers });
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
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    const channelHandler = new VbapChannelHandler(context, { speakers });

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

  it('should correctly set transform', () => {
    // Should be initialised to a quaternion of { x: 0, y: 0, z: 0, w: 1 }.
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    const channelHandler = new VbapChannelHandler(context, { speakers });

    expect(channelHandler.transform.x).toEqual(0);
    expect(channelHandler.transform.y).toEqual(0);
    expect(channelHandler.transform.z).toEqual(0);
    expect(channelHandler.transform.w).toEqual(1);

    const q = new Quaternion(1, 0, 0, 0);
    channelHandler.setTransform(q);
    expect(channelHandler.transform.x).toBeCloseTo(q.x,5);
    expect(channelHandler.transform.y).toBeCloseTo(q.y,5);
    expect(channelHandler.transform.z).toBeCloseTo(q.z,5);
    expect(channelHandler.transform.w).toBeCloseTo(q.w,5);
  });

  it('should not update position with transform', () => {
    // Should be initialised to a quaternion of { x: 0, y: 0, z: 0, w: 1 }.
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    const channelHandler = new VbapChannelHandler(context, { speakers });

    expect(channelHandler.transform.x).toEqual(0);
    expect(channelHandler.transform.y).toEqual(0);
    expect(channelHandler.transform.z).toEqual(0);
    expect(channelHandler.transform.w).toEqual(1);

    // Should correctly set position to { x: 0, y: 1, z: 0 }.
    channelHandler.setPosition({ polar: false, x: 0, y: 1, z: 0 }, 0);
    expect(channelHandler.position.x).toBeCloseTo(0, 5);
    expect(channelHandler.position.y).toBeCloseTo(1, 5);
    expect(channelHandler.position.z).toBeCloseTo(0, 5);

    // Should correctly rotate position 90deg around z to { x: -1, y: 0, z: 0 }.
    const q = new Quaternion().setFromAxisAngle(new Vector3(0,0,1), Math.PI*0.5);
    channelHandler.setTransform(q);
    expect(channelHandler.transform.x).toBeCloseTo(q.x,5);
    expect(channelHandler.transform.y).toBeCloseTo(q.y,5);
    expect(channelHandler.transform.z).toBeCloseTo(q.z,5);
    expect(channelHandler.transform.w).toBeCloseTo(q.w,5);
    expect(channelHandler.position.x).toBeCloseTo(0, 5);
    expect(channelHandler.position.y).toBeCloseTo(1, 5);
    expect(channelHandler.position.z).toBeCloseTo(0, 5);

    // Set position in 2 seconds time, and check updates
    channelHandler.setPosition({ polar: false, x: -1, y: 0, z: 0 }, 2);
    expect(channelHandler.position.x).toBeCloseTo(0, 5);
    expect(channelHandler.position.y).toBeCloseTo(1, 5);
    expect(channelHandler.position.z).toBeCloseTo(0, 5);
    // Action clock ticks and then check position has been set and not transformed.
    context.currentTime = 2;
    jasmine.clock().tick(2 * 1000);
    expect(channelHandler.position.x).toBeCloseTo(-1,5);
    expect(channelHandler.position.y).toBeCloseTo(0, 5);
    expect(channelHandler.position.z).toBeCloseTo(0, 5);
  });

  it('should correctly update transformed position with transform', () => {
    // Should be initialised to a quaternion of { x: 0, y: 0, z: 0, w: 1 }.
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    const channelHandler = new VbapChannelHandler(context, { speakers });
    
    expect(channelHandler.transform.x).toEqual(0);
    expect(channelHandler.transform.y).toEqual(0);
    expect(channelHandler.transform.z).toEqual(0);
    expect(channelHandler.transform.w).toEqual(1);

    // Should correctly set transformed position to { x: 0, y: 1, z: 0 }.
    channelHandler.setPosition({ polar: false, x: 0, y: 1, z: 0 }, 0);
    expect(channelHandler.transformedPosition.x).toBeCloseTo(0, 5);
    expect(channelHandler.transformedPosition.y).toBeCloseTo(1, 5);
    expect(channelHandler.transformedPosition.z).toBeCloseTo(0, 5);

    // Should correctly rotate position 90deg around z to { x: -1, y: 0, z: 0 }.
    const q = new Quaternion().setFromAxisAngle(new Vector3(0,0,1), Math.PI*0.5);
    channelHandler.setTransform(q);
    expect(channelHandler.transform.x).toBeCloseTo(q.x,5);
    expect(channelHandler.transform.y).toBeCloseTo(q.y,5);
    expect(channelHandler.transform.z).toBeCloseTo(q.z,5);
    expect(channelHandler.transform.w).toBeCloseTo(q.w,5);
    expect(channelHandler.transformedPosition.x).toBeCloseTo(-1,5);
    expect(channelHandler.transformedPosition.y).toBeCloseTo(0, 5);
    expect(channelHandler.transformedPosition.z).toBeCloseTo(0, 5);

    // Set position in 2 seconds time, and check it gets updated to the transformed position
    channelHandler.setPosition({ polar: false, x: -1, y: 0, z: 0 }, 2);
    expect(channelHandler.transformedPosition.x).toBeCloseTo(-1, 5);
    expect(channelHandler.transformedPosition.y).toBeCloseTo(0,  5);
    expect(channelHandler.transformedPosition.z).toBeCloseTo(0,  5);
    // Action clock ticks and then check transformedPosition has been updated properly
    context.currentTime = 2;
    jasmine.clock().tick(2 * 1000);
    expect(channelHandler.transformedPosition.x).toBeCloseTo(0,  5);
    expect(channelHandler.transformedPosition.y).toBeCloseTo(-1, 5);
    expect(channelHandler.transformedPosition.z).toBeCloseTo(0,  5);

    // Set position for 4 seconds, then set transform at 3 seconds
    channelHandler.setPosition({ polar: false, x: 0, y: 0, z: 1 }, 4);
    expect(channelHandler.transformedPosition.x).toBeCloseTo(0,  5);
    expect(channelHandler.transformedPosition.y).toBeCloseTo(-1, 5);
    expect(channelHandler.transformedPosition.z).toBeCloseTo(0,  5);
    context.currentTime = 3;
    jasmine.clock().tick(1 * 1000);
    q.setFromAxisAngle(new Vector3(1,0,0), Math.PI*0.5);
    channelHandler.setTransform(q);
    expect(channelHandler.transform.x).toBeCloseTo(q.x,5);
    expect(channelHandler.transform.y).toBeCloseTo(q.y,5);
    expect(channelHandler.transform.z).toBeCloseTo(q.z,5);
    expect(channelHandler.transform.w).toBeCloseTo(q.w,5);
    expect(channelHandler.transformedPosition.x).toBeCloseTo(-1,5);
    expect(channelHandler.transformedPosition.y).toBeCloseTo(0, 5);
    expect(channelHandler.transformedPosition.z).toBeCloseTo(0, 5);
    context.currentTime = 4;
    jasmine.clock().tick(1 * 1000);
    expect(channelHandler.transformedPosition.x).toBeCloseTo(0, 5);
    expect(channelHandler.transformedPosition.y).toBeCloseTo(-1, 5);
    expect(channelHandler.transformedPosition.z).toBeCloseTo(0, 5);
  });
});
