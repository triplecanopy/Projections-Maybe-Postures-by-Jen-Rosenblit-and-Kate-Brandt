
var uglify = require('gulp-uglify')
var autoprefixer = require('gulp-autoprefixer')
var sass = require('gulp-sass')
var path = require('path')
var gulp = require('gulp')
var cssmin = require('gulp-cssnano')
var exec = require('child_process').exec

gulp.task('scripts', function () {
  return exec('babel --presets es2015,stage-0 ./lib/jsx/application.jsx -o ./public/javascripts/application.js', { cwd: './' }, (function(err) {
    if (err) { throw err }
  }))
})

gulp.task('sass', function () {
  return gulp.src('./lib/sass/application.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(gulp.dest('./.tmp'))
})

gulp.task('styles', ['sass'], function () {
  console.log('Running `styles` task')
  return gulp.src('./.tmp/application.css')
  .pipe(autoprefixer(['> 1%', 'last 2 versions']))
  .on('error', function (e) { console.error(e) })
  .pipe(gulp.dest("./public/stylesheets"))
})

gulp.task('minify', ['styles'], function () {
  return gulp.src("./public/stylesheets/application.css")
  .pipe(cssmin({ keepSpecialComments: 0 }))
  .pipe(gulp.dest('./'))
})

gulp.task('uglify', ['scripts'], function () {
  return gulp.src("./public/javascripts/application.js")
  .pipe(uglify())
  .pipe(gulp.dest("./public/javascripts/"))
})

gulp.task('watch', ['styles', 'scripts'], function () {
  gulp.watch(['./lib/sass/*.scss'], ['styles'])
  return gulp.watch(['./lib/jsx/*.jsx'], ['scripts'])
})

gulp.task('build', ['sass', 'styles', 'uglify', 'minify'], function () {
  return console.log('Build succeded!')
})

gulp.task('serve', ['watch'], function () {})
gulp.task('default', ['serve'], function () {})
