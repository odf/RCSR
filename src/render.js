'use strict';

GLOBAL.localStorage = (function() {
  var _store = {};

  return {
    setItem: function(key, value) { _store[key] = value; },
    getItem: function(key) { return _store[key]; }
  };
})();


var fs    = require('fs');
var React = require('react');

var Application = require('./app.es6');

var path = process.argv[2];
var html = React.renderToString(
  React.createElement(Application, { path: path }));
var layout = fs.readFileSync(process.argv[3], { encoding: 'utf8' });

console.log(layout.replace(/Loading.../, html));
