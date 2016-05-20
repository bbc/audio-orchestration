import MockAudioContext from './../mock-audio-context';
import HrtfHelper from './../../src/renderer/hrtf-helper';
import hrtfs from './hrtfs';

describe('HrtfHelper', () => {
  beforeEach(() => {
    // As HRTFs are manipulated in situ they need to be reset before each test.
    for (let i = 0; i < hrtfs.length; i++) {
      delete hrtfs[i].buffer;
    }
  });

  it('should correctly populate buffers on valid hrtfs', () => {
    const context = MockAudioContext.createAudioContext();

    HrtfHelper.populateBuffers(hrtfs, context);
    hrtfs.forEach((hrtf) => {
      expect(hrtf.buffer).toEqual(jasmine.any(AudioBuffer));
      expect(hrtf.buffer.numberOfChannels).toEqual(2);
      expect(hrtf.buffer.sampleRate).toEqual(context.sampleRate);

      const leftChannel = hrtf.buffer.getChannelData(0);
      const rightChannel = hrtf.buffer.getChannelData(1);
      const expectedLength = Math.min(
        hrtf.fir_coeffs_left.length,
        hrtf.fir_coeffs_right.length);
      expect(leftChannel.length).toEqual(expectedLength);
      expect(rightChannel.length).toEqual(expectedLength);

      for (let i = 0; i < leftChannel.length; i++) {
        expect(leftChannel[i]).toBeCloseTo(hrtf.fir_coeffs_left[i], 5);
        expect(rightChannel[i]).toBeCloseTo(hrtf.fir_coeffs_right[i], 5);
      }
    });
  });

  it('should not error on multiple calls.', () => {
    const context = MockAudioContext.createAudioContext();

    HrtfHelper.populateBuffers(hrtfs, context);
    HrtfHelper.populateBuffers(hrtfs, context);
    hrtfs.forEach((hrtf) => {
      expect(hrtf.buffer).toEqual(jasmine.any(AudioBuffer));
    });
  });

  it('should handle custom irLength', () => {
    const context = MockAudioContext.createAudioContext();

    HrtfHelper.populateBuffers(hrtfs, context, context.sampleRate, 5);
    hrtfs.forEach((hrtf) => {
      const leftChannel = hrtf.buffer.getChannelData(0);
      const rightChannel = hrtf.buffer.getChannelData(1);
      expect(leftChannel.length).toEqual(5);
      expect(rightChannel.length).toEqual(5);
      expect(hrtf.buffer.sampleRate).toEqual(context.sampleRate);
    });
  });

  it('should handle custom sampleRate', () => {
    const context = MockAudioContext.createAudioContext();

    HrtfHelper.populateBuffers(hrtfs, context, 44000);
    hrtfs.forEach((hrtf) => {
      const leftChannel = hrtf.buffer.getChannelData(0);
      const rightChannel = hrtf.buffer.getChannelData(1);
      const expectedLength = Math.min(
        hrtf.fir_coeffs_left.length,
        hrtf.fir_coeffs_right.length);
      expect(leftChannel.length).toEqual(expectedLength);
      expect(rightChannel.length).toEqual(expectedLength);
      expect(hrtf.buffer.sampleRate).toEqual(44000);
    });
  });
});
