import Spatialiser from
  './../../../../src/renderer/binaural/spatialiser-channel-handler/spatialiser';
import SpatialiserFilterSelector from
  './../../../../src/renderer/binaural/spatialiser-channel-handler/spatialiser-filter-selector';
import MockAudioContext from './../../../mock-audio-context';
import HrtfHelper from './../../../../src/renderer/hrtf-helper';
import HrtfGenerator from './../../hrtf-generator';

describe('Spatialiser', () => {
  beforeAll(function beforeAll() {
    jasmine.clock().install();

    this.positions = [
      { az: 0, el: 0, d: 1, polar: true },
      { az: 102, el: 40, d: 1, polar: true },
      { az: -10, el: -14, d: 1, polar: true },
      { az: 170, el: -80, d: 1, polar: true },
      { az: -120, el: 80, d: 1, polar: true },
      { az: -120, el: 80, d: 1, polar: true },
      { az: 37, el: 79, d: 1, polar: true },
    ];
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  it('should correctly construct', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(8, 8);
    const context = MockAudioContext.createAudioContext();
    HrtfHelper.populateBuffers(hrtfs, context);

    const spatialiserFilterSelector = new SpatialiserFilterSelector(hrtfs);
    const spatialiser = new Spatialiser(context, spatialiserFilterSelector);

    expect(spatialiser).toBeDefined();
  });

  it('should expose crossfadeDuration', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(8, 8);
    const context = MockAudioContext.createAudioContext();
    HrtfHelper.populateBuffers(hrtfs, context);

    const spatialiserFilterSelector = new SpatialiserFilterSelector(hrtfs);
    const spatialiser = new Spatialiser(context, spatialiserFilterSelector);

    spatialiser.crossfadeDuration = 0.05;
    expect(spatialiser.crossfadeDuration).toEqual(0.05);
    spatialiser.crossfadeDuration = 0.07;
    expect(spatialiser.crossfadeDuration).toEqual(0.07);
  });

  it('should expose delayScaling', function it() {
    const hrtfs = HrtfGenerator.generateHrtfs(8, 8, 10, true);
    const context = MockAudioContext.createAudioContext(2, 2);
    HrtfHelper.populateBuffers(hrtfs, context);
    HrtfHelper.populateDelayAggregates(hrtfs);

    const spatialiserFilterSelector = new SpatialiserFilterSelector(hrtfs);
    const spatialiser = new Spatialiser(context, spatialiserFilterSelector);

    // When no position is set.
    spatialiser.delayScaling = 0;
    expect(spatialiser.delayScaling).toEqual(0);

    // When a position is set.
    spatialiser.setPosition(this.positions[0]);
    spatialiser.delayScaling = 0.5;
    expect(spatialiser.delayScaling).toEqual(0.5);

    // When a position is set and a position is pending.
    spatialiser.setPosition(this.positions[1]);
    spatialiser.delayScaling = 1;
    expect(spatialiser.delayScaling).toEqual(1);
  });

  it('should correctly connect and disconnect', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(8, 8);
    const context = MockAudioContext.createAudioContext();
    HrtfHelper.populateBuffers(hrtfs, context);

    const spatialiserFilterSelector = new SpatialiserFilterSelector(hrtfs);
    const spatialiser = new Spatialiser(context, spatialiserFilterSelector);

    spatialiser.connect(context.destination);
    spatialiser.disconnect(context.destination);
  });

  it('should correctly set position', function it() {
    this.positions.forEach((position) => {
      const hrtfs = HrtfGenerator.generateHrtfs(8, 8);
      const context = MockAudioContext.createAudioContext(2, 2);
      HrtfHelper.populateBuffers(hrtfs, context);

      const spatialiserFilterSelector = new SpatialiserFilterSelector(hrtfs);
      const spatialiser = new Spatialiser(context, spatialiserFilterSelector);

      spatialiser.setPosition(position);
      expect(spatialiser.getPosition()).toEqual(position);

      // Should be unchanged after crossfade completes.
      context.currentTime += 2;
      jasmine.clock().tick(2000);
      expect(spatialiser.getPosition()).toEqual(position);
    });
  });

  it('should correctly queue position changes', function it() {
    for (let i = 1; i < this.positions.length; i++) {
      const position1 = this.positions[i - 1];
      const position2 = this.positions[i];

      const hrtfs = HrtfGenerator.generateHrtfs(8, 8, 10, true);
      const context = MockAudioContext.createAudioContext(2, 2);
      HrtfHelper.populateBuffers(hrtfs, context);
      HrtfHelper.populateDelayAggregates(hrtfs);

      const spatialiserFilterSelector = new SpatialiserFilterSelector(hrtfs);
      const sourceNode = context.createOscillator();
      const spatialiser = new Spatialiser(context, spatialiserFilterSelector);

      spatialiser.connect(context.destination);
      sourceNode.connect(spatialiser.input);
      sourceNode.start();

      // Queue up two position changes.
      spatialiser.setPosition(position1);
      spatialiser.setPosition(position2);

      // First should be actioned. Second must wait for first to complete.
      expect(spatialiser.getPosition()).toEqual(position1);
      context.currentTime += 2;
      jasmine.clock().tick(2000);
      expect(spatialiser.getPosition()).toEqual(position2);
    }
  });
});
