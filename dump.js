'use strict';

var fs = require('fs');

var path = process.argv[2];
var type = process.argv[3] || 'nets';
var json = path.match(/\.json$/);

var parse  = require('./src/parse/' + type);

fs.readFile(path, { encoding: 'utf8' }, function(err, text) {
  var data, start, end;

  if (err)
    throw new Error(err);
  else {
    start = process.hrtime();
    data = json ? JSON.parse(text) : parse(text);
    end = process.hrtime(start);

    console.log(JSON.stringify(data, null, 4));
    console.warn("Parsed in " + (end[0] + end[1] / 1000000000) + " seconds");
  }
});
