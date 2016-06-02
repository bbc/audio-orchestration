import MockAudioContext from './../mock-audio-context';
import HrtfHelper from './../../src/renderer/hrtf-helper';
import HrtfGenerator from './hrtf-generator';

describe('HrtfHelper', () => {
  it('populateBuffers should correctly populate buffers on valid hrtfs', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
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

  it('populateBuffers should not error on multiple calls.', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
    const context = MockAudioContext.createAudioContext();

    HrtfHelper.populateBuffers(hrtfs, context);
    HrtfHelper.populateBuffers(hrtfs, context);
    hrtfs.forEach((hrtf) => {
      expect(hrtf.buffer).toEqual(jasmine.any(AudioBuffer));
    });
  });

  it('populateBuffers should handle custom irLength', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
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

  it('populateBuffers should handle custom sampleRate', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32);
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

  it('populateDelayAggregates should calculate min correctly', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32, 10, true);

    let minDelay = Infinity;
    hrtfs.forEach((hrtf) => {
      minDelay = Math.min(minDelay, hrtf.toas[0], hrtf.toas[1]);
    });

    HrtfHelper.populateDelayAggregates(hrtfs);
    expect(hrtfs.minDelay).toEqual(jasmine.any(Number));
    expect(hrtfs.minDelay).toEqual(minDelay);
  });

  it('populateDelayAggregates should calculate mean correctly', () => {
    const hrtfs = HrtfGenerator.generateHrtfs(32, 32, 10, true);

    let total = 0;
    hrtfs.forEach((hrtf) => {
      total += hrtf.toas[0] + hrtf.toas[1];
    });
    const mean = total / (2 * hrtfs.length);

    HrtfHelper.populateDelayAggregates(hrtfs);
    expect(hrtfs.meanDelay).toEqual(jasmine.any(Number));
    expect(hrtfs.meanDelay).toEqual(mean);
  });
});
