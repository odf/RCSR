'use strict';

var express = require('express');

var home = process.argv[2];

var app = express();

app.use(express.compress());

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
