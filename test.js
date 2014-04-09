'use strict';


var fs = require('fs');
var cc = require('ceci-core');

var parse  = require('./src/parse-3dall');
var search = require('./src/search');


var fileContents = function(path) {
  return cc.nbind(fs.readFile, fs)(path, { encoding: 'utf8' });
};


var byKey = function(key, a, b) {
  if (a[key] < b[key])
    return -1;
  else if (a[key] > b[key])
    return 1;
  else
    return 0;
};


cc.top(cc.go(function*() {
  var data   = parse(yield fileContents(process.argv[2]));
  var query  = JSON.parse(process.argv[3])
  var result = search(data, query).slice();

  result.sort(byKey.bind(null, 'symbol'));

  console.log("-- Found", result.length, "results --");

  for (var i in result)
    console.log(result[i].symbol);
}));
