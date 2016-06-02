import RendererNode from './../../src/renderer/renderer-node';
import EqualPowerChannelHandler from './../../src/renderer/stereo/equal-power-channel-handler';
import MockAudioContext from './../mock-audio-context';
import mockRenderRoutines from './renderer-node-routines';
import createMetadata from './../metadata-generator';

describe('RendererNode', () => {
  beforeAll(() => {
    jasmine.clock().install();
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  it('should construct correctly', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandlerFactory = EqualPowerChannelHandler.createFactory();
    const rendererNode = new RendererNode(context, 2, channelHandlerFactory);

    expect(rendererNode).toBeDefined();
  });

  it('should expose read only channelConfigurations', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandlerFactory = EqualPowerChannelHandler.createFactory();
    const rendererNode = new RendererNode(context, 2, channelHandlerFactory);

    expect(rendererNode.channelConfigurations).toBeDefined();
    expect(() => { rendererNode.channelConfigurations = null; })
      .toThrowError(TypeError);
  });

  it('should expose correct number of channelConfigurations', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandlerFactory = EqualPowerChannelHandler.createFactory();

    const rendererNode1 = new RendererNode(context, 5, channelHandlerFactory);
    const channelConfigurations1 = rendererNode1.channelConfigurations;
    expect(channelConfigurations1.length).toEqual(5);

    const rendererNode2 = new RendererNode(context, 8, channelHandlerFactory);
    const channelConfigurations2 = rendererNode2.channelConfigurations;
    expect(channelConfigurations2.length).toEqual(8);
  });

  it('should accept metadata correctly', () => {
    const context = MockAudioContext.createAudioContext();
    const channelHandlerFactory = EqualPowerChannelHandler.createFactory();
    const rendererNode = new RendererNode(context, 2, channelHandlerFactory);

    // Should ignore invalid metadata.
    rendererNode.addMetaData(null);
    // Should accept empty metadata.
    rendererNode.addMetaData([]);
    // Should accept valid metadata.
    rendererNode.addMetaData(createMetadata(1));
    // Should accept metadata out of order.
    rendererNode.addMetaData(createMetadata(2));
    rendererNode.addMetaData(createMetadata(1));
    // Should accept metadata with channels that are not being rendered.
    rendererNode.addMetaData(createMetadata(3));
    // Should accept partial metadata (e.g. missing gain or position.)
    rendererNode.addMetaData(createMetadata(4));
  });

  it('should handle metadata correctly', (done) => {
    const tests = mockRenderRoutines.map((routine) => new Promise((resolve) => {
      const context = MockAudioContext.createAudioContext(
        routine.channelCount, routine.runTime);
      const sourceNode = context.createOscillator();
      const channelHandlerFactory = EqualPowerChannelHandler.createFactory();
      const rendererNode = new RendererNode(context, routine.channelCount,
        channelHandlerFactory);

      sourceNode.connect(rendererNode.inputs[0]);
      sourceNode.connect(rendererNode.inputs[1]);
      sourceNode.start();
      rendererNode.connect(context.destination);

      // Add the metadata as specified by the test routine.
      routine.metadata.forEach((metadata) => {
        rendererNode.addMetaData(metadata);
      });

      // Start rendering and tick clocks forward.
      rendererNode.start();
      context.currentTime += routine.runTime;
      jasmine.clock().tick(routine.runTime * 1000);

      // Run the context and then verify channel configuration.
      context.startRendering();
      context.oncomplete = () => {
        const actualConfigurations = rendererNode.channelConfigurations;
        routine.expectedChannelConfig.forEach((expectedConfiguration, i) => {
          const actualPosition = actualConfigurations[i].position;
          const expectedPosition = expectedConfiguration.position;

          expect(actualPosition.x).toBeCloseTo(expectedPosition.x, 5);
          expect(actualPosition.y).toBeCloseTo(expectedPosition.y, 5);
          expect(actualPosition.z).toBeCloseTo(expectedPosition.z, 5);

          // TODO: Uncomment this when bug is fixed in Firefox.
          // const actualGain = actualConfigurations[i].gain;
          // const expectedGain = expectedConfiguration.gain;
          //
          // expect(actualGain).toEqual(expectedGain);
        });
        rendererNode.stop();
        resolve();
      };
    }));

    Promise.all(tests).then(done);
  });
});
