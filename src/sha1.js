'use strict';

var Rusha = require('rusha');

var rusha = new Rusha();

module.exports = function(data) {
  return rusha.digestFromBuffer(Buffer.concat([
    new Buffer('blob '+data.length+'\0'),
    new Buffer(data)
  ]))
};
