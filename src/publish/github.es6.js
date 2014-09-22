'use strict';

var cc = require('ceci-core');


module.exports = function(options) {
  var request = cc.nbind(function(verb, path, data, cb) {
    var req  = new XMLHttpRequest();
    var auth = new Buffer(options.token+':x-oauth-basic').toString('base64');

    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        cb(null, {
          status: req.status,
          data  : req.responseText && JSON.parse(req.responseText),
          ok    : req.status >= 200 && req.status < 300
        });
      }
    };

    req.upload.addEventListener('progress', function(e) {
      var percent = e.loaded / e.total * 100;
      //console.log(percent+'% completed');
    }, false);

    req.open(verb, options.baseURL + path, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('User-Agent', options.userAgent);
    req.setRequestHeader('Origin', options.origin);
    req.setRequestHeader('Authorization', 'Basic '+auth);

    if (data == null)
      req.send();
    else
      req.send(JSON.stringify(data));
  });

  var get = function(path) {
    return cc.go(function*() {
      var response, result, content;

      response = yield request('GET', path, null);
      result = response.data;

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
      result = response.data;

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
