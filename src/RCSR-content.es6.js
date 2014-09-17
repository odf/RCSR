'use strict';

var cc     = require('ceci-core');
var github = require('./github-content.es6');


var test = function() {
  cc.go(function*() {
    var gh, path, content, response;

    gh = github({
      baseURL  : 'https://api.github.com/repos/odf/RCSR-content/contents/',
      token    : process.env.RCSR_TOKEN,
      userAgent: 'RCSR',
      origin   : 'http://rcsr.net'
    });

    path     = process.argv[2];
    content  = process.argv[3];
    response = yield (content ? gh.put(path, content) : gh.get(path));

    if (response.ok)
      console.log(JSON.stringify(response, null, 4));
    else
      console.error(JSON.stringify(response, null, 4));
  }).then(null, function(ex) { console.error(ex + '\n' + ex.stack); });
};


if (require.main == module)
  test();
