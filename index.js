
var express = require('express')
var fs = require('fs')
var path = require('path')
var app = express()

app.set('port', (process.env.PORT || 5000))

app.use(express.static(__dirname + '/public'))

// views is directory for all template files
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.get('/', function(req, res) {
  res.render('pages/index')
})

app.get('/api/media', function(req, res) {
  res.setHeader('Content-Type', 'application/json')
  fs.readdir(path.join(__dirname, '/public'), function(err, files) {
    var media = files.map(function(file) {
      switch (path.extname(file)) {
        case '.jpg':
          return { type: 'image', url: path.basename(file, '.jpg') }
        case '.mp3':
          return { type: 'audio', url: path.basename(file, '.mp3') }
        case '.mp4':
          return { type: 'video', url: path.basename(file, '.mp4') }
        default:
          break
      }
    })
    res.send({ body: JSON.stringify(media.filter(Boolean)) })
  })
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'))
})


