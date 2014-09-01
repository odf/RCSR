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
    for (var i in values)
      if (item.keywords.indexOf(values[i].toLowerCase()) < 0)
        return false;
    return true;
  },
  modifiers: function(item, values) {
    if (values.exclude_a && item.symbol.match(/-a$/))
      return false;
    if (values.exclude_b_c && item.symbol.match(/-[bc]/))
      return false;
    return true;
  },
  coordination: function(item, values) {
    var seen = item.vertices.map(function(v) { return v.coordinationNumber; });
    return common.equalSets(values, seen);
  },
  "density"           : common.rangeMatcher('density'),
  "td10"              : common.rangeMatcher('td10'),
  "genus"             : common.rangeMatcher('genus'),
  "kinds of vertex"   : common.rangeMatcher('numberOfVertices'),
  "kinds of edge"     : common.rangeMatcher('numberOfEdges'),
  "kinds of face"     : common.rangeMatcher('numberOfFaces'),
  "kinds of tile"     : common.rangeMatcher('numberOfTiles'),
  "space group number": common.rangeMatcher('spacegroupNumber'),
  "smallest ring"     : common.rangeMatcher('smallestRingSize'),
  "order"             : common.rangeMatcher('averageVertexOrder'),
  "Dsize"             : common.rangeMatcher('sizeOfDSymbol')
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

    if (m == 'is' && matches.length == 0)
      matches = matches.concat(data.filter(check(s + '-z', m)));
  } else
    matches = data;

  return matches;
};


var withAugmented = function(results, data, query) {
  var symbols = {};
  var out = [];
  var i, s;

  for (i in results) {
    s = results[i].symbol;
    symbols[s] = true;
    symbols[s + '-a'] = true;
  }

  for (i in data)
    if (symbols[data[i].symbol])
      out.push(data[i]);

  return out;
};


var cmp = function(a, b) {
  return (a == b) ? 0 : (a < b) ? -1 : 1;
};


module.exports = function(data, query) {
  var results = filteredBySymbol(data, query)
    .filter(function(item) { return matches(item, query); });

  if (query.modifiers && query.modifiers.include_a)
    results = withAugmented(results, data, query);

  return results
    .sort(function(a, b) { return cmp(a.symbol, b.symbol); });
};
