'use strict';

var cc   = require('ceci-core');
var sha1 = require('../sha1');


module.exports = function(options) {
  var request = function(verb, path, data, onProgress) {
    var req  = new XMLHttpRequest();
    var auth = new Buffer(options.token+':x-oauth-basic').toString('base64');
    var result = cc.defer();

    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        var data = (req.responseText && JSON.parse(req.responseText)) || {};
        if (req.status >= 200 && req.status < 300) //TODO implement redirecting
          result.resolve({
            status: req.status,
            data  : data
          });
        else
          result.reject(req.status+' '+data.message);
      }
    };

    if (onProgress)
      req.upload.addEventListener('progress', onProgress, false);

    req.open(verb, options.baseURL + path, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('User-Agent', options.userAgent);
    req.setRequestHeader('Origin', options.origin);
    req.setRequestHeader('Authorization', 'Basic '+auth);

    if (data == null)
      req.send();
    else
      req.send(JSON.stringify(data));

    return result;
  };

  var get = function(path) {
    return cc.go(function*() {
      var response, result, content;

      response = yield request('GET', path);
      result = response.data;

      if (result.content)
        content = new Buffer(result.content, 'base64').toString('utf8');

      return {
        status : response.status,
        result : result,
        content: content,
        sha    : result.sha
      };
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

  var put = function(path, content, message, onProgress) {
    return cc.go(function*() {
      var data, response, result;

      data = {
        message: message || 'automated commit',
        content: new Buffer(content).toString('base64'),
        sha    : yield shaFor(path)
      };

      response = yield request('PUT', path, data, onProgress);
      result = response.data;

      //TODO report an error if these don't match
      console.log(result.content.sha);
      console.log(sha1(content));

      return {
        status: response.status,
        sha   : result.content.sha,
        commit: {
          sha: result.commit.sha
        }
      };
    });
  };

  return {
    get: get,
    put: put
  }
};
