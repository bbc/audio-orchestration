const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const sass = require('sass');

module.exports = {
  mode: process.env.NODE_ENV !== 'production' ? 'development' : 'production',
  devtool: process.env.NODE_ENV !== 'production' ? 'source-map' : false,
  entry: [
    path.resolve(__dirname, 'src/index.js'),
  ],
  output: {
    clean: true,
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          // fallback to style-loader in development
          process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: sass,
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1000,
            },
          },
        ],
      },
      {
        test: /\.(eot|ttf|woff|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts',
            },
          },
        ],
      },
      {
        test: [/\.jsx?$/],
        exclude: [/node_modules/],
        loader: 'babel-loader',
      },
      {
        test: require.resolve('qrcodejs/qrcode'),
        use: 'exports-loader?QRCode',
      },
    ],
  },
  resolve: {
    symlinks: false,
    extensions: ['.js', '.jsx'],
    alias: {
      'react-dom': '@hot-loader/react-dom',
      actions: path.resolve(__dirname, 'src/template/actions'),
      components: path.resolve(__dirname, 'src/components'),
      pages: path.resolve(__dirname, 'src/pages'),
      config: path.resolve(__dirname, 'src/config.js'),
      sagas: path.resolve(__dirname, 'src/sagas.js'),
      selectors: path.resolve(__dirname, 'src/selectors.js'),
      theme: path.resolve(__dirname, 'src/theme.scss'),
      'reith-fonts': path.resolve(__dirname, 'src/reith-fonts.scss'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: false,
      minify: false,
      template: path.resolve(__dirname, 'src/index.html'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'audio'), to: 'audio', toType: 'dir' },
        { from: path.resolve(__dirname, 'images'), to: 'images', toType: 'dir' },
      ],
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: 'bundle.css',
    }),
    new CleanWebpackPlugin(),
    new webpack.BannerPlugin({
      banner: fs.readFileSync(path.resolve(__dirname, 'LICENSE'), 'utf-8'),
    }),
  ],
};
