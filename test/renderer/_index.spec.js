import {
  createStereoRenderer,
  createBinauralRenderer,
  createVbapRenderer,
  createBvsRenderer,
} from './../../src/renderer/_index';
import RendererNode from './../../src/renderer/renderer-node';
import MockAudioContext from './../mock-audio-context';
import HrtfHelper from './../../src/renderer/hrtf-helper';
import HrtfGenerator from './hrtf-generator';
import speakerConfigurations from './speaker-configurations';

describe('_index', () => {
  it('should provide a createStereoRenderer function', () => {
    const context = MockAudioContext.createAudioContext();

    const renderer1 = createStereoRenderer(context, 2);
    expect(renderer1).toEqual(jasmine.any(RendererNode));
    expect(renderer1.inputs.length).toBe(2);

    const renderer2 = createStereoRenderer(context, 4);
    expect(renderer2).toEqual(jasmine.any(RendererNode));
    expect(renderer2.inputs.length).toBe(4);
  });

  it('should provide a createBinauralRenderer function', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(8, 8);
    const context = MockAudioContext.createAudioContext();
    HrtfHelper.populateBuffers(hrtfs, context);

    const renderer1 = createBinauralRenderer(context, 2, hrtfs);
    expect(renderer1).toEqual(jasmine.any(RendererNode));
    expect(renderer1.inputs.length).toBe(2);

    const renderer2 = createBinauralRenderer(context, 4, hrtfs);
    expect(renderer2).toEqual(jasmine.any(RendererNode));
    expect(renderer2.inputs.length).toBe(4);
  });

  it('should provide a createVbapRenderer function', () => {
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;

    const renderer1 = createVbapRenderer(context, 2, speakers);
    expect(renderer1).toEqual(jasmine.any(RendererNode));
    expect(renderer1.inputs.length).toBe(2);

    const renderer2 = createVbapRenderer(context, 4, speakers);
    expect(renderer2).toEqual(jasmine.any(RendererNode));
    expect(renderer2.inputs.length).toBe(4);
  });

  it('should provide a createBvsRenderer function', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(8, 8);
    const context = MockAudioContext.createAudioContext();
    const speakers = speakerConfigurations[0].speakers;
    HrtfHelper.populateBuffers(hrtfs, context);

    const renderer1 = createBvsRenderer(context, 2, speakers, hrtfs);
    expect(renderer1).toEqual(jasmine.any(RendererNode));
    expect(renderer1.inputs.length).toBe(2);

    const renderer2 = createBvsRenderer(context, 4, speakers, hrtfs);
    expect(renderer2).toEqual(jasmine.any(RendererNode));
    expect(renderer2.inputs.length).toBe(4);
  });
});
