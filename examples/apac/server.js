var express = require('express');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var config = require('./webpack.config');

var port = 8080;
var app = new express();
var compiler = webpack(config);

app.use(webpackDevMiddleware(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));
app.use(webpackHotMiddleware(compiler));
app.use(express.static('dist'));

app.listen(port, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("Example server listening @ http://localhost:%s/", port);
  }
})
