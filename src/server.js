'use strict';

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

app.get('/public/*', function(req, res) {
  res.sendfile(req.params[0], { root: home });
});

app.get('/help/*', function(req, res) {
  res.sendfile(req.params[0], { root: home + '/help' });
});

app.get('*', function(req, res) {
  res.sendfile('app.html', { root: home });
});

app.listen(3000);
console.log('Server listening on port 3000');
