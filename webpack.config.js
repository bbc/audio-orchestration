const nodeExternals = require('webpack-node-externals');

const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.js'),
  devtool: 'source-map',
  output: {
    filename: 'bbcat-orchestration.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: nodeExternals(),
  module: {
    rules: [
      {
        test: [/\.js?$/],
        exclude: [/node_modules/],
        loader: 'babel-loader',
      },
    ],
  },
  plugins: [],
};
