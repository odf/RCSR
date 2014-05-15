'use strict';

var fs      = require('fs');
var express = require('express');

var home = process.argv[2];

var app = express();

app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());


app.get('/', function(req, res) {
  res.sendfile('index.html', { root: home });
});

app.get('/api/netdata', function(req, res) {
  res.sendfile('3dall.txt', { root: home });
});

app.get('/api/*', function(req, res) {
  res.send(404);
});

app.get('/api', function(req, res) {
  res.send(404);
});

app.get('/public/*', function(req, res) {
  res.sendfile(req.params[0], { root: home });
});

app.get('/public', function(req, res) {
  res.send(404);
});

app.listen(3000);
console.log('Server listening on port 3000');
