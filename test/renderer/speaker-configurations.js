const config4Plus4 = {
  speakers: [{
    channel: 0,
    position: {
      polar: true,
      az: 30,
      el: 0,
      d: 1,
    },
  }, {
    channel: 1,
    position: {
      polar: true,
      az: -30,
      el: 0,
      d: 1,
    },
  }, {
    channel: 2,
    position: {
      polar: true,
      az: 110,
      el: 0,
      d: 1,
    },
  }, {
    channel: 3,
    position: {
      polar: true,
      az: -110,
      el: 0,
      d: 1,
    },
  }, {
    channel: 4,
    position: {
      polar: true,
      az: 30,
      el: 30,
      d: 1,
    },
  }, {
    channel: 5,
    position: {
      polar: true,
      az: -30,
      el: 30,
      d: 1,
    },
  }, {
    channel: 6,
    position: {
      polar: true,
      az: 110,
      el: 30,
      d: 1,
    },
  }, {
    channel: 7,
    position: {
      polar: true,
      az: -110,
      el: 30,
      d: 1,
    },
  }, {
    channel: -1,
    position: {
      polar: true,
      az: 0,
      el: -90,
      d: 1,
    },
    virtual: true,
  }, {
    channel: -1,
    position: {
      polar: true,
      az: 0,
      el: 90,
      d: 1,
    },
    virtual: true,
  }],
  triangles: [
    [0, 8, 2],
    [1, 8, 0],
    [3, 2, 8],
    [3, 8, 1],
    [4, 0, 2],
    [4, 2, 6],
    [4, 6, 9],
    [4, 9, 5],
    [4, 5, 1],
    [4, 1, 0],
    [7, 3, 1],
    [7, 1, 5],
    [7, 5, 9],
    [7, 9, 6],
    [7, 6, 2],
    [7, 2, 3],
  ],
  pans: [{
    position: {
      polar: true,
      az: 0,
      el: 0,
      d: 0,
    },
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: 0,
      el: 0,
      d: 0.5,
    },
    gains: [0.70711, 0.70711, 0, 0, 0, 0, 0, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: 45,
      el: 0,
      d: 0.75,
    },
    gains: [0.96156, 0, 0.2746, 0, 0, 0, 0, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: -32,
      el: 17,
      d: 1,
    },
    gains: [0, 0.65748, 0, 0, 0, 0.75154, 0, 0.0539, 0, 0],
  }, {
    position: {
      polar: false,
      x: 11,
      y: -3,
      z: 7,
    },
    gains: [0, 0.00229, 0, 0, 0, 0.0826, 0, 0.99658, 0, 0],
  }],
};

const config5Plus0 = {
  speakers: [{
    channel: 0,
    position: {
      polar: true,
      az: 30,
      el: 0,
      d: 1,
    },
  }, {
    channel: 1,
    position: {
      polar: true,
      az: -30,
      el: 0,
      d: 1,
    },
  }, {
    channel: 2,
    position: {
      polar: true,
      az: 0,
      el: 0,
      d: 1,
    },
  }, {
    channel: 3,
    position: {
      polar: true,
      az: 110,
      el: 0,
      d: 1,
    },
  }, {
    channel: 4,
    position: {
      polar: true,
      az: -110,
      el: 0,
      d: 1,
    },
  }, {
    channel: -1,
    position: {
      polar: true,
      az: 0,
      el: -90,
      d: 1,
    },
    virtual: true,
  }, {
    channel: -1,
    position: {
      polar: true,
      az: 0,
      el: 90,
      d: 1,
    },
    virtual: true,
  }],
  triangles: [
    [0, 3, 6],
    [0, 5, 3],
    [4, 3, 5],
    [4, 5, 1],
    [4, 1, 6],
    [4, 6, 3],
    [2, 0, 6],
    [2, 6, 1],
    [2, 1, 5],
    [2, 5, 0],
  ],
  pans: [{
    position: {
      polar: true,
      az: 0,
      el: 0,
      d: 0,
    },
    gains: [0, 0, 0, 0, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: 0,
      el: 0,
      d: 0.5,
    },
    gains: [0, 0, 1, 0, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: 45,
      el: 0,
      d: 0.75,
    },
    gains: [0.96156, 0, 0, 0.2746, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: 9,
      el: -80,
      d: 1,
    },
    gains: [0.05465, 0, 0.1252, 0, 0, 0.99063, 0],
  }, {
    position: {
      polar: false,
      x: -13,
      y: 3,
      z: -63,
    },
    gains: [0.11491, 0, 0, 0.15434, 0, 0.98131, 0],
  }],
};

const config5Plus4 = {
  speakers: [{
    channel: 0,
    position: {
      polar: true,
      az: 30,
      el: 0,
      d: 1,
    },
  }, {
    channel: 1,
    position: {
      polar: true,
      az: -30,
      el: 0,
      d: 1,
    },
  }, {
    channel: 2,
    position: {
      polar: true,
      az: 0,
      el: 0,
      d: 1,
    },
  }, {
    channel: 3,
    position: {
      polar: true,
      az: 110,
      el: 0,
      d: 1,
    },
  }, {
    channel: 4,
    position: {
      polar: true,
      az: -110,
      el: 0,
      d: 1,
    },
  }, {
    channel: 5,
    position: {
      polar: true,
      az: 30,
      el: 30,
      d: 1,
    },
  }, {
    channel: 6,
    position: {
      polar: true,
      az: -30,
      el: 30,
      d: 1,
    },
  }, {
    channel: 7,
    position: {
      polar: true,
      az: 110,
      el: 30,
      d: 1,
    },
  }, {
    channel: 8,
    position: {
      polar: true,
      az: -110,
      el: 30,
      d: 1,
    },
  }, {
    channel: -1,
    position: {
      polar: true,
      az: 0,
      el: -90,
      d: 1,
    },
    virtual: true,
  }, {
    channel: -1,
    position: {
      polar: true,
      az: 0,
      el: 90,
      d: 1,
    },
    virtual: true,
  }],
  triangles: [
    [0, 9, 3],
    [4, 3, 9],
    [4, 9, 1],
    [2, 6, 1],
    [2, 1, 9],
    [2, 9, 0],
    [5, 0, 3],
    [5, 3, 7],
    [5, 7, 10],
    [5, 10, 6],
    [5, 6, 2],
    [5, 2, 0],
    [8, 4, 1],
    [8, 1, 6],
    [8, 6, 10],
    [8, 10, 7],
    [8, 7, 3],
    [8, 3, 4],
  ],
  pans: [{
    position: {
      polar: true,
      az: 0,
      el: 0,
      d: 0,
    },
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: 0,
      el: 0,
      d: 0.5,
    },
    gains: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: 45,
      el: 0,
      d: 0.75,
    },
    gains: [0.96156, 0, 0, 0.2746, 0, 0, 0, 0, 0, 0, 0],
  }, {
    position: {
      polar: true,
      az: -19,
      el: -5,
      d: 0.3,
    },
    gains: [0, 0.85701, 0.50227, 0, 0, 0, 0, 0, 0, 0.11515, 0],
  }, {
    position: {
      polar: false,
      x: 1,
      y: 1,
      z: 1,
    },
    gains: [0, 0, 0, 0, 0, 0, 0.96133, 0, 0.27453, 0, 0.02175],
  }],
};

export default [
  config4Plus4,
  config5Plus0,
  config5Plus4,
];
