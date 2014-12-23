module.exports = function (config) {
  config.set({

    basePath: './public',

    files: [
      // './components/angular/angular.js',
      // './components/angular-route/angular-route.js',
      // './components/angular-mocks/angular-mocks.js',
      // './components/**/*.js',
      // './modules/**/*.js'
      // './modules/**/*.js'
      './modules/**/*.test.js'
    ],

    preprocessors: {
      './modules/**/*.test.js': ['browserify', 'coverage']
    },

    logLevel: config.LOG_INFO,

    autoWatch: true,

    frameworks: ['mocha', 'browserify'],

    browsers: ['PhantomJS'],
    // browsers: ['PhantomJS', 'Chrome', 'Firefox', 'Safari'],

    reporters: ['progress', 'coverage', 'junit'],

    browserify: {
      debug: true
    },

    coverageReporter: {
      type: 'html',
      dir: './../generated/test/front/'
    },

    junitReporter: {
      outputFile: './../generated/test/front/unit.xml',
      suite: 'unit'
    }

  });
};
