'use strict';

var agent    = require('superagent');

agent
  .get('public/hello.txt')
  .set('Accept', 'text/plain')
  .end(function(res){
    if (res.ok) {
      alert('Got "' + res.text + '"');
    } else {
      alert('Oh no! error ' + res.text);
    }
  }.bind(this));
