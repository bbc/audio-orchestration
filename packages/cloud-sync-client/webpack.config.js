const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/client/CloudSyncKit.js'),
  // TODO: Original grunt file produced a second bundle with externalized dvbcss-*.
  // path.resolve(__dirname, 'src/client/CloudSynchroniser.js'),
  devtool: 'source-map',
  output: {
    clean: true,
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
  node: {
    global: true,
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: require.resolve('buffer'),
    }),
  ],
};
