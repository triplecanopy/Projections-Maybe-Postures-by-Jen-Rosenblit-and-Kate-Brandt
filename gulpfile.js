/* eslint-disable */
var uglify = require('gulp-uglify')
var autoprefixer = require('gulp-autoprefixer')
var sass = require('gulp-sass')
var path = require('path')
var gulp = require('gulp')
var cssmin = require('gulp-cssnano')
var rename = require('gulp-rename')
var exec = require('child_process').exec
var fs = require('fs-extra')

var rev = '601fc8b4e73c5e35bc7ec9089d03c805'

gulp.task('scripts', function (done) {
  return exec([
    './node_modules/.bin/browserify',
    './lib/js/application.js -o',
    './public/' + rev + '.js -t',
    '[ babelify --presets [ es2015 ] ]'
  ].join(' '), { cwd: './' }, (function(err) {
    if (err) { throw err }
    done()
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
  return gulp.src('./public/' + rev + '.js')
  .pipe(uglify())
  .pipe(gulp.dest('./public/'))
})

gulp.task('watch', ['styles', 'scripts'], function () {
  gulp.watch(['./lib/sass/*.scss'], ['styles'])
  gulp.watch(['./lib/js/*.js'], ['scripts'])
})

gulp.task('clean', function(done) {
  return exec('rm ./*.css ./*.js', { cwd: './public' }, function(err) {
    // if (err) { throw err }
    done()
  })
})

gulp.task('build', ['clean', 'sass', 'styles', 'uglify', 'minify'], function (done) {
  console.log("\nFinished build")
  return done()
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

gulp.task('revision', function(done) {
  var prev = rev
  var uuid = guid()
  var regex = new RegExp(rev, 'g')
  var files = [
    path.join(__dirname, 'views/pages/index.ejs'),
    path.join(__dirname, 'gulpfile.js')
  ]
  return files.forEach(function(file, i) {
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) { throw err }
      var contents = data.replace(regex, uuid)
      fs.writeFile(file, contents, function(err) {
        if (err) { throw err }
        if (i === files.length - 1) {
          done()
        }
      })
    })
  })
})

gulp.task('writeManifest', function(done) {
  var manifestFile = path.join(__dirname, 'dist/manifest.json')
  var assets = fs.readdirSync(path.join(__dirname, 'public')).filter(function(asset) {
    return asset.charAt(0) !== '.'
  })
  var manifest = assets.map(function(asset) {
    switch(path.extname(asset)) {
      case '.jpg':
        return { type: 'image', url: 'https://s3.amazonaws.com/tc3-whitecube/rosenblit/' + path.basename(asset, '.jpg') }
      case '.ogg':
        return { type: 'audio', url: 'https://s3.amazonaws.com/tc3-whitecube/rosenblit/' + path.basename(asset, '.ogg') }
      case '.webm':
        return { type: 'video', url: 'https://s3.amazonaws.com/tc3-whitecube/rosenblit/' + path.basename(asset, '.webm') }
      default:
        return null
    }
  }).filter(Boolean)
  return fs.writeFile(manifestFile, JSON.stringify(manifest), function(err) {
    if (err) { throw err }
    return done()
  })
})

gulp.task('copy.dist', function(done) {
  var distDir = path.join(__dirname, 'dist')
  var assetsDir = path.join(__dirname, 'public')
  var appEJS = path.join(__dirname, 'views/pages/index.ejs')
  var appHTML = path.join(__dirname, 'dist/index.html')
  return fs.copy(assetsDir, distDir, function(err) {
    if (err) { throw err }
      return fs.copy(appEJS, appHTML, function(err) {
        if (err) { throw err }
        return done()
      })
  })
})

gulp.task('prepare.dist', function(done) {
  var dist = path.join(__dirname, 'dist')
  return fs.remove(dist, function(err) {
    if (err) { throw err }
    return fs.mkdirp(dist, function(err) {
      if (err) { throw err }
      return done()
    })
  })
})

gulp.task('dist.pre', [/*'revision',*/'prepare.dist', 'build'], function(done) {
  console.log("\nPre-build succeded")
  return done()
})

gulp.task('dist.post', ['copy.dist', 'writeManifest'], function(done) {
  console.log("\nAll done!")
})

gulp.task('build.dist', ['dist.pre'], function(done) {
  gulp.run('dist.post')
  done()
})
