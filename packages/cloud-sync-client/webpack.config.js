const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/client/CloudSyncKit.js'),
  // TODO: Original grunt file produced a second bundle with externalized dvbcss-*.
  // path.resolve(__dirname, 'src/client/CloudSynchroniser.js'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist/browser'),
    filename: 'CloudSyncKit.js',
    library: {
      name: 'CloudSyncKit',
      type: 'umd', // Was commonjs2 in original grunt build
    },
  },
  module: {},
  plugins: [],
  resolve: {
    alias: {
      '$client': path.resolve(__dirname, 'src/client'),
      '$common': path.resolve(__dirname, 'src/common'),
    },
  },
};
