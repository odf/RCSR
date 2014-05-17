'use strict';


var asSet = function(a) {
  var result = {};
  for (var i in a)
    result[a[i]] = 1;
  return result;
};


var equalSets = function(a, b) {
  var sa = asSet(a);
  var sb = asSet(b);

  return (a.every(function(x) { return sb[x] == 1; })
          &&
          b.every(function(x) { return sa[x] == 1; }));
};


var matchText = {
  'is'         : function(s, p) { return s == p; },
  'contains'   : function(s, p) { return s.match(p) != null; },
  'begins with': function(s, p) { return s.match('^' + p) != null; }
};


var search = function(pattern, mode, list) {
  return list.some(function(text) {
    return matchText[mode](text.toLowerCase(), pattern);
  });
};


var rangeMatcher = function(key) {
  return function(item, range) {
    var value = item[key];

    if (range.exclusive) {
      if (range.from != null && value <= range.from)
        return false;
      if (range.to != null && value >= range.to)
        return false;
    } else {
      if (range.from != null && value < range.from)
        return false;
      if (range.to != null && value > range.to)
        return false;
    }

    return true;
  };
};


var matcher = {
  symbol: function(item, value) {
    return true;
  },
  names: function(item, value) {
    var s = value.text.toLowerCase()
    var m = value.mode || 'is';
    return search(s, m, item.names) || search(s, m, item.otherNames);
  },
  keywords: function(item, values) {
    for (var i in values)
      if (item.keywords.indexOf(values[i].toLowerCase()) < 0)
        return false;
    return true;
  },
  modifiers: function(item, values) {
    if (values.exclude_a_b_c && item.symbol.match(/-[abc]/))
      return false;
    return true;
  },
  coordination: function(item, values) {
    var seen = item.vertices.map(function(v) { return v.coordinationNumber; });
    return equalSets(values, seen);
  },
  "density"           : rangeMatcher('density'),
  "td10"              : rangeMatcher('td10'),
  "genus"             : rangeMatcher('genus'),
  "kinds of vertex"   : rangeMatcher('numberOfVertices'),
  "kinds of edge"     : rangeMatcher('numberOfEdges'),
  "kinds of face"     : rangeMatcher('numberOfFaces'),
  "kinds of tile"     : rangeMatcher('numberOfTiles'),
  "space group number": rangeMatcher('spacegroupNumber'),
  "smallest ring"     : rangeMatcher('smallestRingSize'),
  "order"             : rangeMatcher('averageVertexOrder'),
  "Dsize"             : rangeMatcher('sizeOfDSymbol')
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
      return search(s, m, [item.symbol]) || search(s, m, item.otherSymbols);
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
    .filter(function(item) { return matches(item, query); })
    .sort(function(a, b) { return cmp(a.symbol, b.symbol); });

  if (query.modifiers && query.modifiers.include_a)
    return withAugmented(results, data, query);
  else
    return results;
};
