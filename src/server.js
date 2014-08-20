'use strict';

var fs = require('fs');
var express = require('express');

var home = process.argv[2];

var app = express();

app.use(express.logger('dev'));
app.use(express.compress());

app.get('/images/:type/:name.jpg', function(req, res) {
  var path = req.path;
  if (fs.existsSync(home + path))
    res.sendfile(path, { root: home });
  else
    res.sendfile('/images/placeholder.jpg', { root: home });
});

app.get('/', function(req, res) {
  res.sendfile('app.html', { root: home });
});

app.get('*', function(req, res) {
  var path = req.path;
  if (fs.existsSync(home + path))
    res.sendfile(path, { root: home });
  else
    res.sendfile('app.html', { root: home });
});

app.listen(3000);
console.log('Server listening on port 3000');
