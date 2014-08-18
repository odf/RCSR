'use strict';

var agent = require('superagent');
var cc    = require('ceci-core');


var request = cc.nbind(function(verb, url, data, cb) {
  agent(verb, url)
    .auth(process.env.RCSR_TOKEN, 'x-oauth-basic')
    .set('User-Agent', 'nodejs')
    .send(data)
    .end(cb);
});


cc.go(function*() {
  var path, content, url, response, result, verb, data;

  path = process.argv[2];
  content = process.argv[3];

  url = 'https://api.github.com/repos/odf/RCSR-content/contents/' + path;
  response = yield request('GET', url, null);
  result = JSON.parse(response.text);

  if (!content) {
    if (response.ok) {
      content = new Buffer(result.content, 'base64').toString('utf8');
      console.log(content);
    } else
      console.error(response.status + ' ' + result.message);
  } else {
    verb = 'PUT';
    data = {
      message: 'test commit via github API',
      content: new Buffer(content).toString('base64')
    };
    if (response.ok)
      data.sha = result.sha;

    response = yield request(verb, url, data);
    result = JSON.parse(response.text);

    if (response.ok)
      console.log(result);
    else
      console.error(response.status + ' ' + result.message);
  }

}).then(null, function(ex) { console.error(ex); });
