const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('transpile-server', () => {
  return gulp.src(['./test/server.js'])
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('transpile-fitbit', () => {
  return gulp.src(['./lib/fitbit/index.js'])
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(gulp.dest('./dist/fitbit/'));
});

gulp.task('babel-server', () => {
  return gulp.watch(['./test/server.js'], ['transpile-server']);
});

gulp.task('babel-fitbit', () => {
  return gulp.watch(['./lib/fitbit/index.js'], ['transpile-fitbit']);
});

gulp.task('default', [
  'transpile-server',
  'transpile-fitbit',
  'babel-server',
  'babel-fitbit'
]);
