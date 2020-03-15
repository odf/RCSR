'use strict';

var fs = require('fs');
var express = require('express');
var compression = require('compression');
var morgan = require('morgan');

var home = process.argv[2];

var app = express();

app.use(morgan('dev'));
app.use(compression());

app.get('/:name.manifest', function(req, res) {
  var path = req.path;
  if (fs.existsSync(home + path)) {
    res.setHeader('Content-Type', 'text/cache-manifest');
    res.sendFile(path, { root: home });
  }
});

app.get('/images/:type/:initial/:name.jpg', function(req, res) {
  var path = req.path;
  if (fs.existsSync(home + path))
    res.sendFile(path, { root: home });
  else
    res.sendFile('/images/placeholder.jpg', { root: home });
});

app.get('/', function(req, res) {
  res.sendFile('app.html', { root: home });
});

app.get('*', function(req, res) {
  var path = req.path;
  if (fs.existsSync(home + path))
    res.sendFile(path, { root: home });
  else
    res.sendFile('app.html', { root: home });
});

app.listen(3000);
console.log('Server listening on port 3000');
