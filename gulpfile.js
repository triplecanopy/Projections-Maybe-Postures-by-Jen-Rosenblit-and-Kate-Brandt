
var uglify = require('gulp-uglify')
var autoprefixer = require('gulp-autoprefixer')
var sass = require('gulp-sass')
var path = require('path')
var gulp = require('gulp')
var cssmin = require('gulp-cssnano')
var rename = require('gulp-rename')
var exec = require('child_process').exec
var fs = require('fs')

var rev = '225e92edf94a82374237a175707db021'

gulp.task('scripts', function () {
  return exec('browserify ./lib/jsx/application.jsx -o ./public/' + rev + '.js -t [ babelify --presets [ es2015 ] ]', { cwd: './' }, (function(err) {
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
  .pipe(rename({ basename: rev }))
  .on('error', function (e) { console.error(e) })
  .pipe(gulp.dest('./public'))
})

gulp.task('minify', ['styles'], function () {
  return gulp.src('./public/' + rev + '.css')
  .pipe(cssmin({ keepSpecialComments: 0 }))
  .pipe(gulp.dest('./public'))
})

gulp.task('uglify', ['scripts'], function () {
  return gulp.src('./public/javascripts/' + rev + '.js')
  .pipe(uglify())
  .pipe(gulp.dest('./public/javascripts/'))
})

gulp.task('watch', ['styles', 'scripts'], function () {
  gulp.watch(['./lib/sass/*.scss'], ['styles'])
  gulp.watch(['./lib/jsx/*.jsx'], ['scripts'])
})

gulp.task('clean', function() {
  return exec('rm ./*.css ./*.js', { cwd: './public' }, function(err) {
    // if (err) { throw err }
  })
})

gulp.task('build', ['clean', 'sass', 'styles', 'uglify', 'minify'], function () {
  return console.log('Build succeded!')
})

gulp.task('serve', ['watch'], function () {})
gulp.task('default', ['serve'], function () {})

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4()
}

gulp.task('revision', function() {
  var prev = rev
  var uuid = guid()
  var regex = new RegExp(rev, 'g')
  var files = [
    path.join(__dirname, 'views/pages/index.ejs'),
    path.join(__dirname, 'gulpfile.js')
  ]
  files.forEach(function(file) {
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) { throw err }
      var contents = data.replace(regex, uuid)
      fs.writeFile(file, contents, function(err) {
        if (err) { throw err }
      })
    })
  })
})
