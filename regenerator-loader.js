var regenerator = require("regenerator");


module.export = function(source) {
  this.cacheable(true);
  return regenerator(source, { includeRuntime: true });
};
