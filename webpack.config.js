var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.join(__dirname, 'src', 'bbcat.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "bbcat.js",
    libraryTarget: "umd",
    library: "bbcat"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        cacheDirectory: true,
        presets: ['es2015'],
        plugins: [ 'transform-runtime' ]
      }
    }]
  }
};
