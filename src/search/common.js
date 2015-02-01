'use strict';

var asSet = function(a) {
  var result = {};
  for (var i in a)
    result[a[i]] = 1;
  return result;
};


var subset = function(a, b) {
  var sb = asSet(b);

  return a.every(function(x) { return sb[x] == 1; });
};


var equalSets = function(a, b) {
  return subset(a, b) && subset(b, a);
};


var properSubset = function(a, b) {
  return subset(a, b) && !subset(b, a);
};


var reEscape = function(p) {
  return p.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
};


var matchText = {
  'is'         : function(s, p) { return s == p; },
  'contains'   : function(s, p) { return s.match(reEscape(p)) != null; },
  'begins with': function(s, p) { return s.match('^' + reEscape(p)) != null; }
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


module.exports = {
  subset      : subset,
  properSubset: properSubset,
  equalSets   : equalSets,
  search      : search,
  rangeMatcher: rangeMatcher
};
