var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var reactify = require('reactify');
var watchify = require('watchify');
var resolutions = require('browserify-resolutions');
var eslint = require('gulp-eslint');
var path = require('path');

gulp.task('browserify', function () {
  var bundler = browserify({
    entries: ['./main.js'],
    paths: ['./node_modules','./public'],
    transform: [reactify],
    debug: true,
    // Required properties for watchify
    cache: {}, packageCache: {}, fullPaths: true
  }).plugin(resolutions, '*')
    .on('time', function (time) {
      console.log('Bundle updated in ' + (time / 1000) + 's.');
    });

  var watcher = watchify(bundler);

  var bundle = function () {
    watcher
      .bundle()
      .on('error', function (err) {
        console.log(err.toString());
      })
      .pipe(source('main.js'))
      .pipe(gulp.dest('./public/build/'));
  };
  bundle();
  return watcher.on('update', function (filenames) {
    filenames.forEach(function (filename) {
      console.log(path.relative(__dirname, filename) + ' changed.');
    });
    bundle();
  });
});

gulp.task('default', ['browserify']);

var options = {
  rulePaths: ['.eslint_rules']
};

var JS = [
  '*.js'
];

var BRUCE_FILES = [
  '*'
];

gulp.task('eslint', function () {
  return gulp.src(JS)
    .pipe(eslint(options))
    .pipe(eslint.format());
});
