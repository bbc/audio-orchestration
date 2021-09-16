const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.js'),
  devtool: 'source-map',
  output: {
    clean: true,
    path: path.resolve(__dirname, 'dist'),
    filename: 'bbcat-orchestration.js',
    library: {
      name: 'bbcatOrchestration',
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
