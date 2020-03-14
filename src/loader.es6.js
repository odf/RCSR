'use strict';

var agent = require('superagent');
var csp   = require('plexus-csp');

var parseNets   = require('./parse/nets');
var parseLayers = require('./parse/layers');
var parseRibbons= require('./parse/ribbons');
var parsePolys  = require('./parse/polys');


var htmlFromServer = function(path) {
  return csp.go(function*() {
    var res;

    res = yield csp.nbind(agent.get)(path);
    if (res.ok)
      return res.text;
    else
      alert('Could not load ' + path);
  });
};


var helpPage = function(path) {
  return csp.go(function*() {
    var res;

    res = yield csp.nbind(agent.get)('/help'+path);
    if (res.ok)
      return res.text;
    else
      alert('Could not load help page for ' + path);
  });
};


var builtinData = function(type, txtPath, parse, symbol) {
  return csp.go(function*() {
    var data, res;

    res = yield csp.nbind(agent.get)(txtPath);
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


var builtinRibbonData = function(symbol) {
  return builtinData(
    'ribbons',
    '/data/1dall.txt',
    parseRibbons,
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


var allBuiltinData = function() {
  return csp.go(function*() {
    var data = yield csp.join([builtinNetData(),
                               builtinLayerData(),
                               builtinRibbonData(),
                               builtinPolyData()]);
    return {
      Nets     : data[0],
      Layers   : data[1],
      Ribbons  : data[2],
      Polyhedra: data[3]
    };
  });
};


module.exports = function(type, arg) {
  return function(handler) {
    var deferred = {
      'html'     : htmlFromServer,
      'help'     : helpPage,
      'nets'     : builtinNetData,
      'layers'   : builtinLayerData,
      'ribbons'  : builtinRibbonData,
      'polyhedra': builtinPolyData,
      'all'      : allBuiltinData
    }[type](arg);

    csp.go(function*() {
      yield csp.sleep(500);
      handler(null, null);
    });
    csp.go(function*() {
      try {
        handler(null, yield deferred);
      } catch(ex) {
        handler(new Error(ex), null);
      }
    });
  };
}
