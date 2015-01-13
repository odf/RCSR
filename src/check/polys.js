'use strict';

var checkStructure = function(structure, log) {
  var chi;

  structure.warnings.forEach(function(s) { log(structure.symbol+' - '+s); });

  try {
    chi = (structure.numberOfFaces
           - structure.numberOfEdges
           + structure.numberOfVertices);

    if (chi != 2)
      log(structure.symbol+' - Euler characteristic is '+chi);
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
