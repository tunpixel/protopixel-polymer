/* jshint strict: true, browser: true, devel: true, node: true */
/* global require, console */
'use strict';

/** Build Guidelines
 * - compilation target (start script) must be a single file (no *.(scss|js) in gulp.src)
 * - for every script/style, it's generated:
 *    - a debug version .bundle.(css|js) with EMBEDDED source maps
 *    - a minified version .bundle.min.(css|js) with FILE source maps (.map)
 *    ./styles/main.scss --> main.bundle.css, main.bundle.min.css
 *    ./styles/main.js --> main.bundle.css, main.bundle.min.js
 * - generated files are put in the same directory as source's.
 * - with each grunt task, it's put a command line that does the same action
 * - ...
 */

var pkg = require('./package.json');

var gulp = require('gulp');


var gutil = require('gulp-util');

var argv = require('minimist')(process.argv.slice(2));
var IS_WATCH = !!argv.watch;
if (IS_WATCH) {
  gutil.log(
    gutil.colors.red('--watch:'),
    'Watching for changes...'
  );
}

gulp.doneCallback = function() {
  console.log('Done.');
  IS_WATCH = false;
};


var sourcemaps = require('gulp-sourcemaps');


// var clone = require('gulp-clone');
var es = require('event-stream');


// var gulpIf = require('gulp-if');
var gulpIgnore = require('gulp-ignore');

var rename = require('gulp-rename');

var concat = require('gulp-concat');


var sass = require('gulp-sass');
var concatCss = require('gulp-concat-css');
var cssmin = require('gulp-cssmin');


var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var browserify = require('browserify');
var watchify = require('watchify');

var browserify_ = require('gulp-browserify');
// var watchify_ = require('gulp-watchify');


var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');


gulp.task('default', ['shared', 'opinions']);

gulp.task('styles', ['shared-styles', 'opinions-styles']);

gulp.task('scripts', ['shared-scripts', 'opinions-scripts']);


gulp.task('shared', ['shared-styles', 'shared-scripts']);


/**
 * ./styles/main.scss --> main.bundle.css, main.bundle.min.css
 * sass ./public/styles/main.scss:public/styles/main.css
 * sass -w ./public/styles/main.scss:public/styles/main.css // watch
 */
gulp.task('shared-styles', function() {

  var DIR = './public/styles';

  var stream = gulp.src(DIR + '/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(rename('main.bundle.css'))
    // .pipe(concatCss('main.bundle.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(DIR))
    .pipe(cssmin())
    .pipe(rename('main.bundle.min.css'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DIR));

  if (IS_WATCH)
    gulp.watch(DIR + '/*.scss', ['shared-styles']);

  return stream;

});

/**
 * ./scripts/main.js --> main.bundle.js, main.bundle.min.js
 * cat ./public/lib/jquery/dist/jquery.js ./public/lib/bootstrap/dist/js/bootstrap.js > ./public/main.bundle.js
 */
gulp.task('shared-scripts', function() {

  var DIR = './public/scripts';

  var stream = gulp.src([
      './public/components/jquery/dist/jquery.js',
      './public/components/bootstrap/dist/js/bootstrap.js'
    ])
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(concat('main.bundle.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(DIR))
    .pipe(uglify())
    .pipe(rename('main.bundle.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DIR));

  // if (IS_WATCH)
  //  gulp.watch(['bower.json', DIR + '/*.js', '!*.bundle.js', '!*.min.js'], ['shared-scripts']);

  return stream;

});


gulp.task('opinions', ['opinions-styles', 'opinions-scripts']);

gulp.task('opinions-styles', [
  'opinions-timeline-styles',
  'opinions-opinion-styles',
  'opinions-item_-styles'
]);

/**
 * DIR/FILENAME.scss --> FILENAME.css, FILENAME.bundle.min.css
 * sass DIR/FILENAME.scss:DIR/FILENAME.css
 * sass -w DIR/FILENAME.scss:DIR/FILENAME.css // watch
 */
function styleTaskFactory(DIR, FILENAME, TASKNAME) {
  return function() {

    var stream = gulp.src(DIR + '/' + FILENAME + '.scss')
      .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(rename(FILENAME + '.bundle.css'))
      // .pipe(concatCss(FILENAME + '.bundle.css'))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(DIR))
      .pipe(gulpIgnore.exclude('*.map'))
      .pipe(cssmin())
      .pipe(rename(FILENAME + '.bundle.min.css'))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(DIR));

    if (IS_WATCH)
      gulp.watch([DIR + '/' + FILENAME + '.scss', DIR + '/_*.scss'], [TASKNAME]);

    return stream;

  };
}

gulp.task('opinions-timeline-styles', styleTaskFactory('./public/modules/opinions/styles', 'timeline', 'opinions-timeline-styles'));

gulp.task('opinions-opinion-styles', styleTaskFactory('./public/modules/opinions/styles', 'opinion', 'opinions-opinion-styles'));

gulp.task('opinions-item_-styles', styleTaskFactory('./public/modules/opinions/styles', 'item_', 'opinions-item_-styles'));


// gulp.task('opinions-styles', function() {

//  // var DIR = './public/modules/opinions/styles';

//  // var stream1 = gulp.src(DIR + '/timeline.scss')
//  //  .pipe(sourcemaps.init())
//  //  .pipe(sass())
//  //  .pipe(rename('timeline.bundle.css'))
//  //  .pipe(sourcemaps.write())
//  //  .pipe(gulp.dest(DIR))
//  //  .pipe(cssmin())
//  //  .pipe(rename('timeline.bundle.min.css'))
//  //  .pipe(sourcemaps.write('./'))
//  //  .pipe(gulp.dest(DIR))
//  //  // .pipe(concatCss('timeline.bundle.css'))
//  //  // .pipe(sourcemaps.write('./'))
//  //  // .pipe(gulp.dest(DIR))
//  // ;

//  // var stream2 = gulp.src(DIR + '/opinion.scss')
//  //  .pipe(sourcemaps.init())
//  //  .pipe(sass())
//  //  .pipe(rename('opinion.bundle.css'))
//  //  .pipe(sourcemaps.write())
//  //  .pipe(gulp.dest(DIR))
//  //  .pipe(cssmin())
//  //  .pipe(rename('opinion.bundle.min.css'))
//  //  .pipe(sourcemaps.write('./'))
//  //  .pipe(gulp.dest(DIR))
//  //  // .pipe(concatCss('opinion.bundle.css'))
//  //  // .pipe(sourcemaps.write('./'))
//  //  // .pipe(gulp.dest(DIR))
//  // ;

//  // var stream3 = gulp.src(DIR + '/item_.scss')
//  //  .pipe(sourcemaps.init())
//  //  .pipe(sass())
//  //  .pipe(rename('item_.bundle.css'))
//  //  .pipe(sourcemaps.write())
//  //  .pipe(gulp.dest(DIR))
//  //  .pipe(cssmin())
//  //  .pipe(rename('item_.bundle.min.css'))
//  //  .pipe(sourcemaps.write('./'))
//  //  .pipe(gulp.dest(DIR))
//  //  // .pipe(concatCss('item_.bundle.css'))
//  //  // .pipe(sourcemaps.write('./'))
//  //  // .pipe(gulp.dest(DIR))
//  // ;


//  // if (IS_WATCH)
//  //  gulp.watch(['bower.json', DIR + '/*.scss', './public/styles/*.scss'], ['opinions-styles']);

//  // return es.merge(stream1, stream2, stream3);

//  // return es.merge(
//  //  styleTaskFactory('./public/modules/opinions/styles', 'timeline', 'opinions-styles')(),
//  //  styleTaskFactory('./public/modules/opinions/styles', 'opinion', 'opinions-styles')(),
//  //  styleTaskFactory('./public/modules/opinions/styles', 'item_', 'opinions-styles')()
//  // );

// });

gulp.task('opinions-scripts', [
  'opinions-timeline-scripts',
  'opinions-opinion-scripts',
  'opinions-restaurant-scripts',
  'opinions-plate-scripts',
  'opinions-pair-scripts',
  'opinions-user-scripts'
]);

/**
 * DIR/FILENAME.js --> FILENAME.bundle.js, FILENAME.bundle.min.js
 * browserify -d DIR/FILENAME.js -o DIR/FILENAME.bundle.js
 * watchify -dv DIR/FILENAME.js -o DIR/FILENAME.bundle.js
 */
function scriptTaskFactory(DIR, FILENAME) {
  return function() {

    //    var stream1 = gulp.src(DIR + '/' + FILENAME + '.js')
    //      .pipe(browserify_({
    //        debug: true
    //      }))
    //      .pipe(rename(FILENAME + '.bundle.js'))
    //      .pipe(gulp.dest(DIR))
    //      .pipe(sourcemaps.init({
    //        loadMaps: true
    //      }))
    //      .pipe(ngAnnotate())
    //      .pipe(uglify())
    //      .pipe(rename(FILENAME + '.bundle.min.js'))
    //      .pipe(sourcemaps.write('./'))
    //      .pipe(gulp.dest(DIR));

    //    var stream2 = gulp.src(['./public/scripts/bundle.js', DIR + '/' + FILENAME + '.bundle.js'])
    //      .pipe(sourcemaps.init())
    //      .pipe(rename(FILENAME + '.bundle.all.js'))
    //      .pipe(sourcemaps.write())
    //      .pipe(gulp.dest(DIR))
    //      .pipe(ngAnnotate())
    //      .pipe(uglify())
    //      .pipe(rename(FILENAME + '.bundle.all.min.js'))
    //      .pipe(sourcemaps.write('./'))
    //      .pipe(gulp.dest(DIR));

    //    // if (IS_WATCH)
    //    //  gulp.watch(['bower.json', DIR + '/*.js', '!**/*.bundle.js', '!**/bundle.js', '!**/*.min.js'], [TASKNAME]);

    //    return es.merge(stream1, stream2);


    var bundler = IS_WATCH ? watchify(browserify(DIR + '/' + FILENAME + '.js', {
      cache: {},
      packageCache: {},
      // fullPaths: true,
      debug: true
    })) : browserify(DIR + '/' + FILENAME + '.js', {
      debug: true
    });

    function bundle(files) {

      if (files)
        console.log(files, ' changed. Bundling ...');

      var stream1 = bundler.bundle()
        .pipe(source(FILENAME + '.bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({
          loadMaps: true
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIR))
        .pipe(gulpIgnore.exclude('*.map'))
        .pipe(sourcemaps.init({
          loadMaps: true
        }))
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(rename(FILENAME + '.bundle.min.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIR));

      var stream2 = gulp.src(['./public/scripts/bundle.js', DIR + '/' + FILENAME + '.bundle.js'])
        .pipe(sourcemaps.init({
          loadMaps: true
        }))
        .pipe(rename(FILENAME + '.bundle.all.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(DIR))
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(rename(FILENAME + '.bundle.all.min.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIR));

      return es.merge(stream1, stream2);

    }

    if (IS_WATCH)
      bundler.on('update', bundle);

    bundler.on('log', gutil.log.bind(gutil, 'Done.'));
    bundler.on('error', gutil.log.bind(gutil, 'Error: '));

    return bundle();

  };
}

gulp.task('opinions-timeline-scripts', scriptTaskFactory('./public/modules/opinions/scripts', 'timeline'));

gulp.task('opinions-opinion-scripts', scriptTaskFactory('./public/modules/opinions/scripts', 'opinion'));

gulp.task('opinions-restaurant-scripts', scriptTaskFactory('./public/modules/opinions/scripts', 'restaurant'));

gulp.task('opinions-plate-scripts', scriptTaskFactory('./public/modules/opinions/scripts', 'plate'));

gulp.task('opinions-pair-scripts', scriptTaskFactory('./public/modules/opinions/scripts', 'pair'));

gulp.task('opinions-user-scripts', scriptTaskFactory('./public/modules/opinions/scripts', 'user'));
