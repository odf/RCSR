'use strict';

var fs      = require('fs');
var express = require('express');

var parse   = require('./parse-3dall');
var search  = require('./search');

var home = process.argv[2];
var data = parse(fs.readFileSync(process.argv[3], { encoding: 'utf8' }));
console.log('Found', data.length, 'nets.');

var bySymbol = {};
var i;

for (i in data) {
  bySymbol[data[i].symbol] = data[i];
}

var app = express();

app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());


app.get('/', function(req, res) {
  res.sendfile('index.html', { root: home });
});

app.get('/api/nets/:id', function(req, res) {
  res.json(bySymbol[req.params.id]);
});

app.post('/api/nets/search', function(req, res) {
  res.json(search(data, req.body).map(function(net) { return net.symbol; }));
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
