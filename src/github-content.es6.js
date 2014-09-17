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
      var response, result, content;

      response = yield request('GET', path, null);
      result = JSON.parse(response.text);

      if (response.ok) {
        if (result.content)
          content = new Buffer(result.content, 'base64').toString('utf8');

        return {
          ok     : response.ok,
          status : response.status,
          result : result,
          content: content,
          sha    : result.sha
        };
      } else {
        return {
          ok     : response.ok,
          status : response.status,
          message: result.message
        }
      }
    });
  };

  var shaFor = function(path) {
    return cc.go(function*() {
      var parts, dir, file, contents, i;

      parts = path.split('/');
      file  = parts.pop();
      dir   = parts.join('/');

      contents = (yield get(dir)).result;
      for (i = 0; i < contents.length; ++i)
        if (contents[i].name == file)
          return contents[i].sha;
    });
  };

  var put = function(path, content, message) {
    return cc.go(function*() {
      var data, response, result;

      data = {
        message: message || 'automated commit',
        content: new Buffer(content).toString('base64'),
        sha    : yield shaFor(path)
      };

      response = yield request('PUT', path, data);
      result = response.text && JSON.parse(response.text);

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
