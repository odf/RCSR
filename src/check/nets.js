'use strict';


var checkStructure = function(net, log) {
  var a = net.edgesPerUnitCell;
  var b = 0.5 * net.vertices.reduce(function(sum, vert) {
    return sum + vert.multiplicity * vert.coordinationNumber;
  }, 0);
  if (a != b)
    log(net.symbol+' - edge numbers inconsistent ('+a+' vs '+b+')');
};


var checkFile = function(data, log) {
  var i, k, net, nr;

  for (i = 0, k = 1; i < data.length; ++i, ++k) {
    net = data[i];
    nr = net.serialNumber;
    if (nr != k) {
      log(net.symbol+' - serial number skipped from '+(k-1)+' to '+nr);
      k = nr;
    }
    checkStructure(net, log);
  }
};


module.exports = checkFile;
