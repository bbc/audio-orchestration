const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: [
    path.resolve(__dirname, 'src/index.js'),
  ],
  output: {
    filename: 'bundle.[hash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: [/\.jsx?$/],
        exclude: [/node_modules/],
        loader: 'babel-loader',
      },
      {
        test: /\.scss$/,
        use: [
          // fallback to style-loader in development
          process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 1000,
        },
      },
    ],
  },
  resolve: {
    symlinks: false,
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/presentation/index.html'),
    }),
    new CopyWebpackPlugin([
      { from: path.resolve(__dirname, 'audio'), to: 'audio', toType: 'dir' },
      { from: path.resolve(__dirname, 'images'), to: 'images', toType: 'dir' },
    ]),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    }),
    new CleanWebpackPlugin([
      'dist',
    ]),
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          mangle: {
            safari10: true,
          },
        },
      }),
    ],
  },
};
