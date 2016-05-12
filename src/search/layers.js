'use strict';

var common = require('./common');


var matcher = {
  symbol: function(item, value) {
    return true;
  },
  names: function(item, value) {
    var s = value.text.toLowerCase()
    var m = value.mode || 'is';
    return (common.search(s, m, item.names) ||
            common.search(s, m, item.otherNames));
  },
  keywords: function(item, values) {
    var keywords = item.keywords.map(function(s) { return s.toLowerCase(); });
    for (var i in values)
      if (keywords.indexOf(values[i].toLowerCase()) < 0)
        return false;
    return true;
  },
  coordination: function(item, values) {
    var seen = item.vertices.map(function(v) { return v.coordination; });
    return common.equalSets(values, seen);
  },
  "kinds of vertex": common.rangeMatcher('kindsOfVertex'),
  "kinds of edge": common.rangeMatcher('kindsOfEdge'),
  "kinds of face": common.rangeMatcher('kindsOfFace'),
};


var matches = function(item, query) {
  var key, good;

  for (var key in query) {
    if (matcher[key])
      good = matcher[key](item, query[key]);
    else
      good = matches(item, query[key]);

    if (!good)
      return false;
  }
  return true;
};


var filteredBySymbol = function(data, query) {
  var spec = query.symbol;
  var s, m, matches;

  var check = function(s, m) {
    return function(item) {
      return (common.search(s, m, [item.symbol]) ||
              common.search(s, m, item.otherSymbols));
    };
  }

  if (spec && spec.text) {
    s = spec.text.toLowerCase()
    m = spec.mode || 'is';

    matches = data.filter(check(s, m));
  } else
    matches = data;

  return matches;
};


var cmp = function(a, b) {
  return (a == b) ? 0 : (a < b) ? -1 : 1;
};


module.exports = function(data, query) {
  return filteredBySymbol(data, query)
    .filter(function(item) { return matches(item, query); })
    .sort(function(a, b) { return cmp(a.symbol, b.symbol); });
};
