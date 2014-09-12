'use strict';

var checkStructure = function(structure, log) {
  structure.warnings.forEach(function(s) { log(structure.symbol+' - '+s); });
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

