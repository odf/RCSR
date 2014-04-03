'use strict';

var fs = require('fs');
var cc = require('ceci-core');


var cellVolume = function(cell) {
  var a = cell.a;
  var b = cell.b;
  var c = cell.c;
  var f = Math.PI / 180.0;
  var ca = Math.cos(cell.alpha * f);
  var cb = Math.cos(cell.beta * f);
  var cc = Math.cos(cell.gamma * f);

  return a*b*c * Math.sqrt(1 + 2*ca*cb*cc - ca*ca - cb*cb - cc*cc);
};


var sumOfMultiplicities = function(elements) {
  return elements.reduce(function(sum, vert) {
    return sum + vert.multiplicity;
  }, 0);
};


var cellMultiplicity = function(symbol) {
  return {
    P: 1,
    A: 2,
    B: 2,
    C: 2,
    I: 2,
    R: 3,
    F: 4 }[symbol[0]];
};


var fileContents = function(path) {
  return cc.nbind(fs.readFile, fs)(path, { encoding: 'utf8' });
};


var splitIntoLines = function(text) {
  return text.split(/\r?\n/);
};


var cleanupLine = function(line) {
  return line.trim().replace(/!.*$/, '');
};


var parseVertexOrEdge = function(lines, startIndex, isVertex) {
  var i = startIndex;
  var result = {};
  var tmp;

  tmp = lines[i].split(/\s+/);
  result.name = tmp[0];
  result.coordinationNumber = parseInt(tmp[1]);

  result.coordinates = {
    numerical: lines[++i].split(/\s+/).map(parseFloat),
    symbolic : lines[++i]
  };

  result.wyckoff = lines[++i];
  result.multiplicity = parseInt(result.wyckoff);

  result.symmetry = lines[++i];

  if (isVertex)
    result.order = parseInt(lines[++i]);

  return { result: result, nextLine: ++i };
};


var parseVertex = function(lines, startIndex) {
  return parseVertexOrEdge(lines, startIndex, true);
};


var parseEdge = function(lines, startIndex) {
  return parseVertexOrEdge(lines, startIndex, false);
};


var parseSection = function(lines, startIndex, parseBlock) {
  var size  = parseInt(lines[startIndex]);
  var start = startIndex + 1;
  var next, result, i, tmp;

  if (parseBlock) {
    next = start;
    result = [];
    for (i = 0; i < size; ++i) {
      tmp = parseBlock(lines, next);
      result.push(tmp.result);
      next = tmp.nextLine;
    }
  } else {
    next = start + size;
    result = lines.slice(start, next);
  }

  return { result: result, nextLine: next };
};


var parseCell = function(line) {
  var tmp = line.split(/\s+/).map(parseFloat);
  var result = {};

  result.a     = tmp[0];
  result.b     = tmp[1];
  result.c     = tmp[2];
  result.alpha = tmp[3];
  result.beta  = tmp[4];
  result.gamma = tmp[5];

  result.volume = cellVolume(result);

  return result;
};


var parseStructure = function(lines, startIndex) {
  var result = {};
  var i, k, key, tmp;

  for (i = startIndex; i < lines.length && lines[i] != "start"; ++i)
    ;

  if (i == lines.length)
    return null;
  else if (i > startIndex)
    console.log('warning: unrecognized content between lines '
                + startIndex + ' and ' + (i-1));

  result.serialNumber = parseInt(lines[++i]);

  if (result.serialNumber < 0)
    return null;

  result.symbol       = lines[++i];
  result.embedType    = lines[++i];
  ++i;

  for (key in { 
    otherSymbols: 0,
    names       : 0,
    otherNames  : 0,
    keywords    : 0,
    references  : 0
  })
  {
    tmp = parseSection(lines, i);
    result[key] = tmp.result;
    i = tmp.nextLine;
  }

  tmp = lines[i].split(/\s+/);
  result.spacegroup = {
    symbol: tmp[0],
    number: parseInt(tmp[1])
  };

  result.cell = parseCell(lines[++i]);

  tmp = parseSection(lines, ++i, parseVertex);
  result.vertices = tmp.result;
  i = tmp.nextLine;

  tmp = parseSection(lines, i, parseEdge);
  result.edges = tmp.result;
  i = tmp.nextLine;

  result.numberOfFaces = parseInt(lines[i]);
  result.numberOfTiles = parseInt(lines[++i]);
  result.sizeOfDSymbol = parseInt(lines[++i]);
  result.tiling = lines[++i];
  result.dual = lines[++i];

  for (k = 0; k < result.vertices.length; ++k) {
    tmp = lines[++i].split(/\s+/).map(function(s) { return parseInt(s); });
    result.vertices[k].coordinationSequence = tmp.slice(0, -1);
    result.vertices[k].cum10 = tmp.slice(-1)[0];
  }

  for (k = 0; k < result.vertices.length; ++k)
    result.vertices[k].symbol = lines[++i];

  result.smallestRingSize = parseInt(lines[++i]);

  result.verticesPerUnitCell = sumOfMultiplicities(result.vertices);
  result.edgesPerUnitCell = sumOfMultiplicities(result.edges);

  result.density =  result.verticesPerUnitCell / result.cell.volume;
  result.genus = 1 +
    (result.edgesPerUnitCell - result.verticesPerUnitCell) / 
    cellMultiplicity(result.spacegroup.symbol);

  result.averageVertexOrder = result.vertices.reduce(function(s, v) {
    return s + v.multiplicity * v.order;
  }, 0) / result.verticesPerUnitCell;

  result.td10 = Math.round(result.vertices.reduce(function(s, v) {
    return s + v.multiplicity * v.cum10;
  }, 0) / result.verticesPerUnitCell);

  return { result: result, nextLine: ++i };
};


cc.top(cc.go(function*() {
  var text = yield fileContents(process.argv[2]);
  var lines = splitIntoLines(text).map(cleanupLine);
  var lineNo = 0;
  var result = [];
  var i, tmp;

  for (;;) {
    tmp = parseStructure(lines, lineNo);
    if (tmp == null)
      break;
    result.push(tmp.result);
    lineNo = tmp.nextLine;
  }

  console.log(JSON.stringify(result, null, 4));
}));
