import CoordinateHelper from './../../src/renderer/coordinate-helper';
import coordinates from './coordinates';

describe('CoordinateHelper', () => {
  beforeAll(function beforeAll() {
    this.decimals = 10;
  });

  it('should correctly validate polar coordinates', () => {
    coordinates.valid.forEach((coordinate) => {
      const isValid = CoordinateHelper
        .isValidADMPolarCoordinate(coordinate.polar);
      expect(isValid).toBeTruthy();
    });

    coordinates.invalidPolar.forEach((polar) => {
      const isValid = CoordinateHelper
        .isValidADMPolarCoordinate(polar);
      expect(isValid).toBeFalsy();
    });
  });

  it('should correctly validate Cartesian coordinates', () => {
    coordinates.valid.forEach((coordinate) => {
      const isValid = CoordinateHelper
        .isValidADMCartesianCoordinate(coordinate.cartesian);
      expect(isValid).toBeTruthy();
    });

    coordinates.invalidCartesian.forEach((cartesian) => {
      const isValid = CoordinateHelper
        .isValidADMCartesianCoordinate(cartesian);
      expect(isValid).toBeFalsy();
    });
  });

  it('should correctly validate both coordinate representations', () => {
    coordinates.valid.forEach((coordinate) => {
      // Check the valid Cartesian representation.
      const isCartesianValid = CoordinateHelper
        .isValidADMCoordinate(coordinate.cartesian);
      expect(isCartesianValid).toBeTruthy();

      // Check the valid polar representation.
      const isPolarValid = CoordinateHelper
        .isValidADMCoordinate(coordinate.polar);
      expect(isPolarValid).toBeTruthy();
    });

    // Check the invalid Cartesian representation.
    coordinates.invalidCartesian.forEach((cartesian) => {
      const isValid = CoordinateHelper
        .isValidADMCoordinate(cartesian);
      expect(isValid).toBeFalsy();
    });

    // Check the invalid polar representation.
    coordinates.invalidPolar.forEach((polar) => {
      const isValid = CoordinateHelper
        .isValidADMCoordinate(polar);
      expect(isValid).toBeFalsy();
    });
  });

  it('should correctly convert polar to Cartesian coordinates', function it() {
    coordinates.valid.forEach((coordinate) => {
      const cartesian = CoordinateHelper
        .convertADMPolarToADMCartesian(coordinate.polar);
      expect(cartesian.polar).toEqual(coordinate.cartesian.polar);
      expect(cartesian.x).toBeCloseTo(coordinate.cartesian.x, this.decimals);
      expect(cartesian.y).toBeCloseTo(coordinate.cartesian.y, this.decimals);
      expect(cartesian.z).toBeCloseTo(coordinate.cartesian.z, this.decimals);
    });
  });

  it('should correctly convert both to Cartesian', function it() {
    coordinates.valid.forEach((coordinate) => {
      // Test polar to Cartesian conversion.
      const cartesian1 = CoordinateHelper
        .convertToADMCartesian(coordinate.polar);
      expect(cartesian1.polar).toEqual(coordinate.cartesian.polar);
      expect(cartesian1.x).toBeCloseTo(coordinate.cartesian.x, this.decimals);
      expect(cartesian1.y).toBeCloseTo(coordinate.cartesian.y, this.decimals);
      expect(cartesian1.z).toBeCloseTo(coordinate.cartesian.z, this.decimals);

      // Test when no conersion is needed.
      const cartesian2 = CoordinateHelper
        .convertToADMCartesian(coordinate.cartesian);
      expect(cartesian2.polar).toEqual(coordinate.cartesian.polar);
      expect(cartesian2.x).toBeCloseTo(coordinate.cartesian.x, this.decimals);
      expect(cartesian2.y).toBeCloseTo(coordinate.cartesian.y, this.decimals);
      expect(cartesian2.z).toBeCloseTo(coordinate.cartesian.z, this.decimals);
    });
  });

  it('should correctly convert Cartesian to polar coordinates', function it() {
    coordinates.valid.forEach((coordinate) => {
      const polar = CoordinateHelper
        .convertADMCartesianToADMPolar(coordinate.cartesian);
      expect(polar.polar).toEqual(coordinate.polar.polar);
      expect(polar.az).toBeCloseTo(coordinate.polar.az, this.decimals);
      expect(polar.el).toBeCloseTo(coordinate.polar.el, this.decimals);
      expect(polar.d).toBeCloseTo(coordinate.polar.d, this.decimals);
    });
  });

  it('should correctly convert both to polar', function it() {
    coordinates.valid.forEach((coordinate) => {
      // Test Cartesian to polar conversion.
      const polar1 = CoordinateHelper
        .convertToADMPolar(coordinate.cartesian);
      expect(polar1.polar).toEqual(coordinate.polar.polar);
      expect(polar1.az).toBeCloseTo(coordinate.polar.az, this.decimals);
      expect(polar1.el).toBeCloseTo(coordinate.polar.el, this.decimals);
      expect(polar1.d).toBeCloseTo(coordinate.polar.d, this.decimals);

      // Test when no conersion is needed.
      const polar2 = CoordinateHelper
        .convertToADMPolar(coordinate.polar);
      expect(polar2.polar).toEqual(coordinate.polar.polar);
      expect(polar2.az).toBeCloseTo(coordinate.polar.az, this.decimals);
      expect(polar2.el).toBeCloseTo(coordinate.polar.el, this.decimals);
      expect(polar2.d).toBeCloseTo(coordinate.polar.d, this.decimals);
    });
  });
});
