'use strict';

var Rusha = require('rusha');

var rusha = new Rusha();

module.exports = function(data) {
  return rusha.digestFromString('blob '+data.length+'\0'
                                + new Buffer(data).toString('utf8'));
};
