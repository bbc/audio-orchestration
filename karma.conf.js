module.exports = function(config) {
  config.set({
    files: ['./src/bbcat.js', {
      pattern: './test/**/*.spec.js',
      watched: false,
      included: true,
      served: true
    }],
    preprocessors: {
      'src/**/*.js': ['webpack'],
      'test/**/*.js': ['webpack']
    },
    browsers: [
      'Firefox',
      'Chrome'
    ],
    reporters: ['dots', 'coverage'],
    coverageReporter: {
      type: 'html',
      dir: 'test/_coverage/'
    },
    frameworks: ['jasmine'],
    webpack: {
      module: {
        loaders: [{
          test: /\.js$/,
          loader: 'babel',
          query: {
            cacheDirectory: true,
            presets: ['es2015'],
            plugins: [['__coverage__', { only: 'src/' }]]
          }
        }]
      },
      watch: true
    },
    webpackServer: {
      noInfo: true
    }
  });
};
