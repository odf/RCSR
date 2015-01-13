'use strict';


var checkEdgeNumberConsistency = function(structure, log) {
  var a = structure.edgesPerUnitCell;
  var b = 0.5 * structure.vertices.reduce(function(sum, vert) {
    return sum + vert.multiplicity * vert.coordinationNumber;
  }, 0);

  if (a != b)
    log(structure.symbol+' - edge numbers inconsistent ('+a+' vs '+b+')');
};


var checkTD10AgainstCoordinationSequence = function(structure, log) {
  structure.vertices.forEach(function(vert) {
    var a = 1 + vert.coordinationSequence.reduce(function(s, n) {
      return s + n;
    });
    var b = vert.cum10;

    if (a != b)
      log(structure.symbol+' - coordination sequence sum is '+a+', not '+b);
  });
};


var checkStructure = function(structure, log) {
  structure.warnings.forEach(function(s) { log(structure.symbol+' - '+s); });
  try {
    checkEdgeNumberConsistency(structure, log);
    checkTD10AgainstCoordinationSequence(structure, log);
  } catch(ex) {
    log(structure.symbol+' - corrupt data ('+ex+')');
  }
};


var checkFile = function(data, log) {
  var i, k, structure, nr, seen;

  seen = {};

  for (i = 0, k = 1; i < data.length; ++i, ++k) {
    structure = data[i];
    nr = structure.serialNumber;
    if (nr != k) {
      log(structure.symbol+' - serial number skipped from '+(k-1)+' to '+nr);
      k = nr;
    }
    if (seen[structure.symbol])
      log(structure.symbol+' - more than one structure with this symbol');
    else
      seen[structure.symbol] = true;

    checkStructure(structure, log);
  }
};


module.exports = checkFile;
