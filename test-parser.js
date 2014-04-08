'use strict';


var fs = require('fs');
var cc = require('ceci-core');
var parse = require('./parse-3dall');


var fileContents = function(path) {
  return cc.nbind(fs.readFile, fs)(path, { encoding: 'utf8' });
};


cc.top(cc.go(function*() {
  var text = yield fileContents(process.argv[2]);

  console.log(JSON.stringify(parse(text), null, 4));
}));
