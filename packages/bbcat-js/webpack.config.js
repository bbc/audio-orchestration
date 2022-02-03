const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'src', 'bbcat.js'),
  devtool: 'source-map',
  output: {
    clean: true,
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
  plugins: [
    new webpack.BannerPlugin({
      banner: fs.readFileSync(path.resolve(__dirname, 'LICENSE'), 'utf-8'),
    }),
  ],
};
