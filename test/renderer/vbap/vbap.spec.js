import Vbap from './../../../src/renderer/vbap/vbap';
import speakerConfigurations from '../speaker-configurations.js';

describe('Vbap', () => {
  it('should correctly validate speaker array', () => {
    // Should construct correctly with valid speaker arrays.
    speakerConfigurations.forEach((speakerConfig) => {
      const vbap = new Vbap(speakerConfig.speakers);
      expect(vbap).toBeDefined();
    });

    let vbap;
    // Speakers array must be provided.
    expect(() => { vbap = new Vbap(); }).toThrow();
    // Speakers array must contain more than two speaker objects.
    expect(() => { vbap = new Vbap([]); }).toThrow();
    // Speakers objects in array  must have valid positions.
    expect(() => { vbap = new Vbap([{}, {}, {}]); }).toThrow();
    expect(vbap).toBeUndefined();
  });

  it('should expose read only speakers property', () => {
    speakerConfigurations.forEach((speakerConfig) => {
      const vbap = new Vbap(speakerConfig.speakers);

      expect(vbap.speakers).toEqual(speakerConfig.speakers);
      expect(() => { vbap.speakers = null; }).toThrowError(TypeError);
    });
  });

  it('should expose read only triangles property', () => {
    speakerConfigurations.forEach((speakerConfig) => {
      const vbap = new Vbap(speakerConfig.speakers);

      expect(vbap.triangles).toEqual(speakerConfig.triangles);
      expect(() => { vbap.triangles = null; }).toThrowError(TypeError);
    });
  });

  it('should return correct speaker gains after panning', () => {
    speakerConfigurations.forEach((speakerConfig) => {
      const vbap = new Vbap(speakerConfig.speakers);

      speakerConfig.pans.forEach((pan) => {
        const speakerGains = vbap.pan(pan.position);
        for (let i = 0; i < pan.gains.length; i++) {
          expect(pan.gains[i]).toBeCloseTo(speakerGains[i], 5);
        }
      });
    });
  });
});
