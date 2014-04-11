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


module.exports = function(data, query) {
  return data.filter(function(item) { return matches(item, query); });
};
