'use strict';

var cc    = require('ceci-core');
var agent = require('superagent');


module.exports = function(options) {
  var request = cc.nbind(function(verb, path, data, cb) {
    agent(verb, options.baseURL + path)
      .auth(options.token, 'x-oauth-basic')
      .set('User-Agent', options.userAgent)
      .set('Origin', options.origin)
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
