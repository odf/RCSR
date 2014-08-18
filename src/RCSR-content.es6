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


var baseURL = 'https://api.github.com/repos/odf/RCSR-content/contents/';


var get = function(path) {
  return cc.go(function*() {
    var response, result;

    response = yield request('GET', baseURL + path, null);
    result = JSON.parse(response.text);

    if (response.ok)
      return {
        ok     : response.ok,
        status : response.status,
        content: new Buffer(result.content, 'base64').toString('utf8'),
        sha    : result.sha
      };
    else
      return {
        ok     : response.ok,
        status : response.status,
        message: result.message
      }
  });
};


var put = function(path, content, message) {
  return cc.go(function*() {
    var data, response, result;

    data = {
      message: message || 'automated commit',
      content: new Buffer(content).toString('base64'),
      sha    : (yield get(path)).sha
    };

    response = yield request('PUT', baseURL + path, data);
    result = JSON.parse(response.text);

    if (response.ok)
      return {
        ok    : response.ok,
        status: response.status,
        sha   : result.content.sha,
        commit: {
          sha: result.commit.sha
        }
      };
    else
      return {
        ok    : response.ok,
        status: response.status,
        message: result.message
      };
  });
};


var test = function() {
  cc.go(function*() {
    var path, content, response;

    path     = process.argv[2];
    content  = process.argv[3];
    response = yield (content ? put(path, content) : get(path));

    if (response.ok)
      console.log(JSON.stringify(response, null, 4));
    else
      console.error(JSON.stringify(response, null, 4));
  }).then(null, function(ex) { console.error(ex + '\n' + ex.stack); });
};


if (require.main == module)
  test();
else
  module.exports = {
    get: get,
    put: put
  };
