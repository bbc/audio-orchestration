const invalidPolarCoordinates = [{
  polar: true,
  el: 0,
  d: 1,
}, {
  polar: true,
  az: 0,
  d: 1,
}, {
  polar: true,
  az: 0,
  el: 0,
}, {
  polar: true,
  az: 'x',
  el: '0',
  d: '1',
}, {
  polar: true,
  az: '0',
  el: 'x',
  d: '1',
}, {
  polar: true,
  az: '0',
  el: '0',
  d: 'x',
}, {
  polar: false,
  az: 0,
  el: 0,
  d: 1,
}, {
  polar: true,
  az: 0,
  el: 0,
  d: -1,
}, {
  polar: true,
  az: -180.1,
  el: 0,
  d: 1,
}, {
  polar: true,
  az: 181.1,
  el: 0,
  d: 1,
}, {
  polar: true,
  az: 0,
  el: -90.1,
  d: 1,
}, {
  polar: true,
  az: 0,
  el: 90.1,
  d: 1,
}];

const invalidCartesianCoordinates = [{
  polar: false,
  y: 0,
  z: 0,
}, {
  polar: false,
  x: 0,
  z: 0,
}, {
  polar: false,
  x: 0,
  y: 0,
}, {
  polar: false,
  x: 'x',
  y: '0',
  z: '0',
}, {
  polar: false,
  x: '0',
  y: 'x',
  z: '0',
}, {
  polar: false,
  x: '0',
  y: '0',
  z: 'x',
}, {
  polar: true,
  x: 0,
  y: 0,
  z: 0,
}];

const validCoordinates = [{
  polar: {
    polar: true,
    az: 0,
    el: 45,
    d: 10,
  },
  cartesian: {
    polar: false,
    x: -0,
    y: 7.0710678118654755,
    z: 7.071067811865475,
  },
}, {
  polar: {
    polar: true,
    az: 30,
    el: 17,
    d: 1,
  },
  cartesian: {
    polar: false,
    x: -0.47815237798151766,
    y: 0.8281842124238669,
    z: 0.29237170472273677,
  },
}, {
  polar: {
    polar: true,
    az: -30,
    el: -45,
    d: 10,
  },
  cartesian: {
    polar: false,
    x: 3.5355339059327373,
    y: 6.123724356957946,
    z: -7.071067811865475,
  },
}, {
  polar: {
    polar: true,
    az: 110,
    el: -90,
    d: 1,
  },
  cartesian: {
    polar: false,
    x: -5.753957801139251e-17,
    y: -2.094269368838496e-17,
    z: -1,
  },
}, {
  polar: {
    polar: true,
    az: -180,
    el: 0,
    d: 5,
  },
  cartesian: {
    polar: false,
    x: 0,
    y: -5,
    z: 0,
  },
}, {
  polar: {
    polar: true,
    az: 0,
    el: 90,
    d: 5,
  },
  cartesian: {
    polar: false,
    x: 0,
    y: 0,
    z: 5,
  },
}];

export default {
  valid: validCoordinates,
  invalidPolar: invalidPolarCoordinates,
  invalidCartesian: invalidCartesianCoordinates,
};
