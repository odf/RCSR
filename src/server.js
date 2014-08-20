'use strict';

var fs = require('fs');
var express = require('express');

var home = process.argv[2];

var app = express();

var cacheTime = 365.25 * 24 * 60 * 60; // one year

var expires = function() {
  return new Date(Date.now() + cacheTime*1000).toUTCString();
};

app.use(express.compress());

app.use(function(req, res, next) {
  res.setHeader("Cache-Control", "public, max-age=" + cacheTime);
  res.setHeader("Expires", expires());
  next();
});

app.get('/images/:type/:name.jpg', function(req, res) {
  var path = req.path;
  if (fs.existsSync(home + path))
    res.sendfile(path, { root: home });
  else
    res.sendfile('/images/placeholder.jpg', { root: home });
});

app.get('/:name.html', function(req, res) {
  res.sendfile(req.path, { root: home });
});

app.get('/:name.css', function(req, res) {
  res.sendfile(req.path, { root: home });
});

app.get('/images/*', function(req, res) {
  res.sendfile(req.path, { root: home });
});

app.get('/js/*', function(req, res) {
  res.sendfile(req.path, { root: home });
});

app.get('/help/*', function(req, res) {
  res.sendfile(req.path, { root: home });
});

app.get('/data/*', function(req, res) {
  res.sendfile(req.path, { root: home });
});

app.get('*', function(req, res) {
  res.sendfile('app.html', { root: home });
});

app.listen(3000);
console.log('Server listening on port 3000');
