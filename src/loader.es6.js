'use strict';

var agent = require('superagent');
var cc    = require('ceci-core');

var parseNets   = require('./parse/nets');
var parseLayers = require('./parse/layers');
var parsePolys  = require('./parse/polys');


var htmlFromServer = function(path) {
  return cc.go(function*() {
    var res;

    res = yield cc.nbind(agent.get)(path);
    if (res.ok)
      return res.text;
    else
      alert('Could not load ' + path);
  });
};


var builtinData = function(type, txtPath, parse, symbol) {
  return cc.go(function*() {
    var data, res;

    res = yield cc.nbind(agent.get)(txtPath);
    if (res.ok)
      data = parse(res.text);

    if (data) {
      if (symbol)
        return data.filter(function(item) {
          return item.symbol == symbol;
        })[0];
      else
        return data;
    } else
      alert('Could not read data for RCSR ' + type);
  });
};


var builtinNetData = function(symbol) {
  return builtinData(
    'nets',
    '/data/3dall.txt',
    parseNets,
    symbol
  );
};


var builtinLayerData = function(symbol) {
  return builtinData(
    'layers',
    '/data/2dall.txt',
    parseLayers,
    symbol
  );
};


var builtinPolyData = function(symbol) {
  return builtinData(
    'polyhedra',
    '/data/0dall.txt',
    parsePolys,
    symbol
  );
};


module.exports = function(type, arg) {
  return function(handler) {
    var deferred = {
      'html'     : htmlFromServer,
      'nets'     : builtinNetData,
      'layers'   : builtinLayerData,
      'polyhedra': builtinPolyData
    }[type](arg);

    cc.go(function*() {
      yield cc.sleep(500);
      handler(null, null);
    });
    cc.go(function*() {
      try {
        handler(null, yield deferred);
      } catch(ex) {
        handler(new Error(ex), null);
      }
    });
  };
}
