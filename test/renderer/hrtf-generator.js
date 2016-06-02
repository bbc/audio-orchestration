export default class HrtfGenerator {
  static generateHrtfs(
      azimuthStep = 8,
      elevationStep = 8,
      irLength = 10,
      toas = false) {
    const hrtfs = [];
    let azimuth = 0;
    let elevation = 0;

    // Sweep through all available elevations.
    while (elevation < 90) {
      // Sweep through all available azimuths.
      while (azimuth < 180) {
        // Generate the default HRTF in the positive azimuth and elevation.
        hrtfs.push(this._generateHrtf(azimuth, elevation, irLength, toas));

        // If elevation is non-zero there is also the negative elevation.
        if (elevation !== 0) {
          hrtfs.push(this._generateHrtf(azimuth, -elevation, irLength, toas));
        }

        // If azimuth is non-zero there is also the azimuth elevation.
        if (azimuth !== 0) {
          hrtfs.push(this._generateHrtf(-azimuth, elevation, irLength, toas));
        }

        // If azimuth and elevation are non-zero there is the mirror in both.
        if (elevation !== 0 && azimuth !== 0) {
          hrtfs.push(this._generateHrtf(-azimuth, -elevation, irLength, toas));
        }

        azimuth += azimuthStep;
      }
      azimuth = 0;
      elevation += elevationStep;
    }

    return hrtfs;
  }

  static _generateHrtf(azimuth, elevation, irLength, toas) {
    const impulseResponse = [[], []];
    const leftOffset = (180 - azimuth) / 360 + (90 - elevation) / 180;
    const rightOffset = (180 + azimuth) / 360 + (90 + elevation) / 180;
    for (let i = 0; i < irLength; i++) {
      impulseResponse[0][i] = Math.sin(i + leftOffset) / 150;
      impulseResponse[1][i] = Math.sin(i + rightOffset) / 150;
    }

    const hrtf = {
      azimuth,
      elevation,
      distance: 1,
      fir_coeffs_left: impulseResponse[0],
      fir_coeffs_right: impulseResponse[1],
    };

    if (toas === true) {
      hrtf.toas = [
        90 + azimuth / 1800,
        90 - azimuth / 1800,
      ];
    }

    return hrtf;
  }
}
