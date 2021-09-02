const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.js'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bbcat-orchestration.js',
    library: 'bbcatOrchestration',
    libraryTarget: 'umd',
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
  plugins: [],
};
