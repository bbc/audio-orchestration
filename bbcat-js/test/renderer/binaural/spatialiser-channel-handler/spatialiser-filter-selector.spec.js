import kdt from 'kdt';
import SpatialiserFilterSelector from
  './../../../../src/renderer/binaural/spatialiser-channel-handler/spatialiser-filter-selector';
import MockAudioContext from './../../../mock-audio-context';
import HrtfGenerator from './../../hrtf-generator';
import HrtfHelper from './../../../../src/renderer/hrtf-helper';

describe('spatialiserFilterSelector', () => {
  beforeAll(function beforeAll() {
    this.mockHrtfs = [
      HrtfGenerator.generateHrtfs(8, 8),
      HrtfGenerator.generateHrtfs(15, 8),
      HrtfGenerator.generateHrtfs(30, 8),
    ];

    this.context = MockAudioContext.createAudioContext();
    this.mockHrtfs.forEach((hrtfs) => {
      HrtfHelper.populateBuffers(hrtfs, this.context);
    });
  });

  it('should correctly construct', function it() {
    this.mockHrtfs.forEach((hrtfs) => {
      const spatialiserFilterSelector = new SpatialiserFilterSelector(hrtfs);
      expect(spatialiserFilterSelector.hrtfs).toEqual(hrtfs);
    });
  });

  it('should select correct HRTF for a given position', function it() {
    // An array of positions to test.
    const positions = [
      { az: 0, el: 0, d: 1, polar: true },
      { az: 102, el: 40, d: 1, polar: true },
      { az: -10, el: -14, d: 1, polar: true },
      { az: 170, el: -80, d: 1, polar: true },
      { az: -120, el: 80, d: 1, polar: true },
      { az: 37, el: 79, d: 1, polar: true },
    ];

    // A function to calculate the distance between two normalised spherical
    // coordinates (no need to consider the distance component or square root.)
    const distanceSquaredFunction = (a, b) =>
      (a.azimuth - b.azimuth) * (a.azimuth - b.azimuth) +
      (a.elevation - b.elevation) * (a.elevation - b.elevation);

    // For each set of mock HRTFs, check that the correct HRTF is returned for
    // each position being tested.
    this.mockHrtfs.forEach((hrtfs) => {
      const spatialiserFilterSelector = new SpatialiserFilterSelector(hrtfs);
      const hrtfKdTree = kdt.createKdTree(
        hrtfs, distanceSquaredFunction, ['azimuth', 'elevation']);

      positions.forEach((position) => {
        const hrtf = spatialiserFilterSelector.getHrtfForPosition(position);
        // Negate the simulate difference between HRTF and ADM format.
        const kdTreeNode = hrtfKdTree.nearest(
          { azimuth: -position.az, elevation: position.el }, 1)[0][0];

        expect(hrtf.azimuth).toEqual(kdTreeNode.azimuth);
        expect(hrtf.elevation).toEqual(kdTreeNode.elevation);
      });
    });
  });
});
