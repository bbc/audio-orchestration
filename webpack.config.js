var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.join(__dirname, 'src', 'bbcat.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "bbcat.js",
    libraryTarget: "var",
    library: "bbcat"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      query: {
        cacheDirectory: true,
        presets: ['es2015']
      }
    }]
  }
};
