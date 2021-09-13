import CompoundNode from './../../src/core/compound-node';
import MockCompoundNode from './mock-compound-node';

describe('CompoundNode', () => {
  beforeAll(function beforeAll() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
  });

  it('should expose read only context', function it() {
    const compoundNode = new CompoundNode(this.context);

    expect(compoundNode.context).toBe(this.context);
    expect(() => {
      compoundNode.context = null;
    }).toThrowError(TypeError);
  });

  it('should expose read only inputs', function it() {
    const mockCompoundNode = new MockCompoundNode(this.context, 3, 0);

    expect(mockCompoundNode.inputs).toEqual(jasmine.any(Array));
    expect(mockCompoundNode.inputs.length).toEqual(3);
    expect(() => { mockCompoundNode.inputs = null; }).toThrowError(TypeError);
  });

  it('should expose read only outputs', function it() {
    const mockCompoundNode = new MockCompoundNode(this.context, 0, 3);

    expect(mockCompoundNode.outputs).toEqual(jasmine.any(Array));
    expect(mockCompoundNode.outputs.length).toEqual(3);
    expect(() => { mockCompoundNode.outputs = null; }).toThrowError(TypeError);
  });

  it('should connect and disconnect with defaults', function it() {
    const mockCompoundNode = new MockCompoundNode(this.context, 0, 1);
    const gainNode = this.context.createGain();

    mockCompoundNode.connect(gainNode);
    mockCompoundNode.disconnect(gainNode);
  });

  it('should return destination from connect for chaining', function it() {
    const mockCompoundNode = new MockCompoundNode(this.context, 0, 1);
    const gainNode = this.context.createGain();

    const connectedNode = mockCompoundNode.connect(gainNode);
    expect(connectedNode).toBe(gainNode);
  });

  it('should connect to an AudioNode', function it() {
    const mockCompoundNode = new MockCompoundNode(this.context, 0, 4);
    const channelMerger = this.context.createChannelMerger(2);

    // Connect 2:1 the channels of mockCompoundNode to channelMerger.
    mockCompoundNode.connect(channelMerger, 0, 0);
    mockCompoundNode.connect(channelMerger, 1, 0);
    mockCompoundNode.connect(channelMerger, 2, 1);
    mockCompoundNode.connect(channelMerger, 3, 1);
  });

  it('should disconnect from an AudioNode', function it() {
    const mockCompoundNode = new MockCompoundNode(this.context, 0, 2);
    const channelMerger = this.context.createChannelMerger(2);

    // Connect 1:1 the channels of mockCompoundNode to channelMerger.
    mockCompoundNode.connect(channelMerger, 0, 0);
    mockCompoundNode.connect(channelMerger, 1, 1);

    // Test that we can disconnect the connections made.
    mockCompoundNode.disconnect(channelMerger, 0, 0);
    mockCompoundNode.disconnect(channelMerger, 1, 1);

    // Should test that attempting to disconnect a non-existant connection
    // throws. However, onlt Chrome current throws, Firfox does not.
    // expect(() => {
    //  mockCompoundNode.disconnect(channelMerger, 0, 1);
    // }).toThrowError(Error);
  });

  it('should connect to a CompoundAudioNode', function it() {
    const mockCompoundNode1 = new MockCompoundNode(this.context, 0, 4);
    const mockCompoundNode2 = new MockCompoundNode(this.context, 2, 0);

    // Connect 2:1 the channels of mockCompoundNode1 to mockCompoundNode2.
    mockCompoundNode1.connect(mockCompoundNode2, 0, 0);
    mockCompoundNode1.connect(mockCompoundNode2, 1, 0);
    mockCompoundNode1.connect(mockCompoundNode2, 2, 1);
    mockCompoundNode1.connect(mockCompoundNode2, 3, 1);
  });

  it('should disconnect from a CompoundAudioNode', function it() {
    const mockCompoundNode1 = new MockCompoundNode(this.context, 0, 2);
    const mockCompoundNode2 = new MockCompoundNode(this.context, 2, 0);

    // Connect 1:1 the channels of mockCompoundNode1 to mockCompoundNode2.
    mockCompoundNode1.connect(mockCompoundNode2, 0, 0);
    mockCompoundNode1.connect(mockCompoundNode2, 1, 1);

    // Test that we can disconnect the connections made.
    mockCompoundNode1.disconnect(mockCompoundNode2, 0, 0);
    mockCompoundNode1.disconnect(mockCompoundNode2, 1, 1);
  });
});
