'use strict';

var fs = require('fs');
var cc = require('ceci-core');

var parse  = require('./src/parse-3dall');

var fileContents = function(path) {
  return cc.nbind(fs.readFile, fs)(path, { encoding: 'utf8' });
};

cc.top(cc.go(function*() {
  var data = parse(yield fileContents(process.argv[2]));
  console.log(JSON.stringify(data, null, 4));
}));
