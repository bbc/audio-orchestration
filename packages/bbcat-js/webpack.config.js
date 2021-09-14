const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'src', 'bbcat.js'),
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bbcat.js',
    library: {
      name: 'bbcat',
      type: 'umd',
    },
  },
  module: {
    rules: [
      {
        test: [/\.m?js$/],
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
};
