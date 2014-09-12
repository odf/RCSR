'use strict';


var checkStructure = function(structure, log) {
  var a, b;

  structure.warnings.forEach(function(s) { log(structure.symbol+' - '+s); });

  a = structure.edgesPerUnitCell;
  b = 0.5 * structure.vertices.reduce(function(sum, vert) {
    return sum + vert.multiplicity * vert.coordinationNumber;
  }, 0);
  if (a != b)
    log(structure.symbol+' - edge numbers inconsistent ('+a+' vs '+b+')');
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
