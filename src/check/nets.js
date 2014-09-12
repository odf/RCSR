'use strict';


var checkStructure = function(net, log) {
  var a, b;

  net.warnings.forEach(function(s) { log(net.symbol+' - '+s); });

  a = net.edgesPerUnitCell;
  b = 0.5 * net.vertices.reduce(function(sum, vert) {
    return sum + vert.multiplicity * vert.coordinationNumber;
  }, 0);
  if (a != b)
    log(net.symbol+' - edge numbers inconsistent ('+a+' vs '+b+')');
};


var checkFile = function(data, log) {
  var i, k, net, nr, seen;

  seen = {};

  for (i = 0, k = 1; i < data.length; ++i, ++k) {
    net = data[i];
    nr = net.serialNumber;
    if (nr != k) {
      log(net.symbol+' - serial number skipped from '+(k-1)+' to '+nr);
      k = nr;
    }
    if (seen[net.symbol])
      log(net.symbol+' - more than one net with this symbol');
    else
      seen[net.symbol] = true;

    checkStructure(net, log);
  }
};


module.exports = checkFile;
