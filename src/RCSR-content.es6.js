'use strict';

var agent = require('superagent');
var cc    = require('ceci-core');


exports.agent = function(baseURL, token) {
  var request = cc.nbind(function(verb, path, data, cb) {
    agent(verb, baseURL + path)
      .auth(token, 'x-oauth-basic')
      .set('User-Agent', 'RCSR')
      .set('Origin', 'http://rcsr.net')
      .send(data)
      .end(cb);
  });

  var get = function(path) {
    return cc.go(function*() {
      var response, result;

      response = yield request('GET', path, null);
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

      response = yield request('PUT', path, data);
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

  return {
    get: get,
    put: put
  }
};


var test = function() {
  cc.go(function*() {
    var agent, path, content, response;

    agent = exports.agent(
      'https://api.github.com/repos/odf/RCSR-content/contents/',
      process.env.RCSR_TOKEN
    );

    path     = process.argv[2];
    content  = process.argv[3];
    response = yield (content ? agent.put(path, content) : agent.get(path));

    if (response.ok)
      console.log(JSON.stringify(response, null, 4));
    else
      console.error(JSON.stringify(response, null, 4));
  }).then(null, function(ex) { console.error(ex + '\n' + ex.stack); });
};


if (require.main == module)
  test();
