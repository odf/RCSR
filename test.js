'use strict';


var fs = require('fs');
var csp = require('plexus-csp');

var parse  = require('./src/parse/nets');
var search = require('./src/search/nets');


var fileContents = function(path) {
  return csp.nbind(fs.readFile, fs)(path, { encoding: 'utf8' });
};


var byKey = function(key, a, b) {
  if (a[key] < b[key])
    return -1;
  else if (a[key] > b[key])
    return 1;
  else
    return 0;
};


csp.top(csp.go(function*() {
  var data   = parse(yield fileContents(process.argv[2]));
  var query  = JSON.parse(process.argv[3])
  var result = search(data, query).slice();

  result.sort(byKey.bind(null, 'symbol'));

  console.log("-- Found", result.length, "results --");

  for (var i in result)
    console.log(result[i].symbol);
}));
