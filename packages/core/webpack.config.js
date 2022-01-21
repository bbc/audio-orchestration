/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */

const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  mode: 'development',
  entry: {
    full: path.resolve(__dirname, 'src/index.full.js'),
    light: path.resolve(__dirname, 'src/index.light.js'),
    'cloud-sync-adapter': path.resolve(__dirname, 'src/index.cloud-sync-adapter.js'),
    'peer-sync-adapter': path.resolve(__dirname, 'src/index.peer-sync-adapter.js'),
  },
  devtool: 'source-map',
  output: {
    clean: true,
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      name: ['audioOrchestration', '[name]'],
      type: 'umd',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
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
