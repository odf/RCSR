'use strict';


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
    var keywords = item.keywords.map(function(s) { return s.toLowerCase(); });
    for (var i in values)
      if (keywords.indexOf(values[i].toLowerCase()) < 0)
        return false;
    return true;
  },
  "number of vertices": rangeMatcher('numberOfVertices'),
  "number of faces"   : rangeMatcher('numberOfFaces'),
  "kinds of vertex"   : rangeMatcher('kindsOfVertex'),
  "kinds of edge"     : rangeMatcher('kindsOfEdge'),
  "kinds of face"     : rangeMatcher('kindsOfFace')
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
