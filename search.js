'use strict';


var equalSets = function(a, b) {
  var sa = {};
  var sb = {};
  var i, k;

  for (i in a)
    sa[a[i]] = 1;

  for (i in b)
    sb[b[i]] = 1;

  for (k in sa)
    if (sb[k] != 1)
      return false;

  for (k in sb)
    if (sa[k] != 1)
      return false;

  return true;
};


var rangeMatcher = function(key) {
  return function(item, range) {
    var value = item[key];

    if (range.from && value < range.from)
      return false;
    if (range.to && value > range.to)
      return false;

    return true;
  };
};


var matcher = {
  symbol: function(item, value) {
    var x = value.toLowerCase()
    return item.symbol == value || item.otherSymbols.indexOf(value) >= 0;
  },
  names: function(item, value) {
    var x = value.toLowerCase()
    return item.names.indexOf(value) >= 0 ||
      item.otherNames.indexOf(value) >= 0;
  },
  keywords: function(item, values) {
    for (var i in values)
      if (item.keywords.indexOf(values[i].toLowerCase()) < 0)
        return false;
    return true;
  },
  coordination: function(item, values) {
    var seen = item.vertices.map(function(v) { return v.coordinationNumber; });
    return equalSets(values, seen);
  },
  density: rangeMatcher('density'),
  td10   : rangeMatcher('td10'),
  genus  : rangeMatcher('genus'),
  nrVerts: rangeMatcher('numberOfVertices'),
  nrEdges: rangeMatcher('numberOfEdges'),
  nrFaces: rangeMatcher('numberOfFaces'),
  nrTiles: rangeMatcher('numberOfTiles'),
  group  : rangeMatcher('spacegroupNumber'),
  minRing: rangeMatcher('smallestRingSize'),
  order  : rangeMatcher('averageVertexOrder'),
  dsSize : rangeMatcher('sizeOfDSymbol')
};


var matches = function(item, query) {
  for (var key in query)
    if (!matcher[key](item, query[key]))
      return false;
  return true;
};


module.exports = function(data, query) {
  return data.filter(function(item) { return matches(item, query); });
};
