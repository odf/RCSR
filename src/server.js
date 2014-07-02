'use strict';

var express = require('express');

var home = process.argv[2];

var app = express();

app.use(express.compress());

app.get('/', function(req, res) {
  res.sendfile('app.html', { root: home });
});

app.get('/nets', function(req, res) {
  res.sendfile('app.html', { root: home });
});

app.get('/layers', function(req, res) {
  res.sendfile('app.html', { root: home });
});

app.get('/polyhedra', function(req, res) {
  res.sendfile('app.html', { root: home });
});

app.get('/admin', function(req, res) {
  res.sendfile('app.html', { root: home });
});

app.get('/public/*', function(req, res) {
  res.sendfile(req.params[0], { root: home });
});

app.get('*', function(req, res) {
  res.send(404);
});

app.listen(3000);
console.log('Server listening on port 3000');
