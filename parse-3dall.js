'use strict';

var fs = require('fs');
var cc = require('ceci-core');


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

  result.coordinatesNumerical = lines[++i].split(/\s+/).map(parseFloat);
  result.coordinatesSymbolic = lines[++i];

  tmp = lines[++i].split(/\s+/);
  result.wyckoff = { number: parseInt(tmp[0]), letter: tmp[1] };

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
  result.spacegroupSymbol = tmp[0];
  result.spacegroupNumber = parseInt(tmp[1]);

  tmp = lines[++i].split(/\s+/).map(parseFloat);
  result.cell = {};
  result.cell.a     = tmp[0];
  result.cell.b     = tmp[1];
  result.cell.c     = tmp[2];
  result.cell.alpha = tmp[3];
  result.cell.beta  = tmp[4];
  result.cell.gamma = tmp[5];

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

  for (k = 0; k < result.vertices.length; ++k)
    result.vertices[k].coordinationSequence = lines[++i]
    .split(/\s+/)
    .map(function(s) { return parseInt(s); });

  for (k = 0; k < result.vertices.length; ++k)
    result.vertices[k].symbol = lines[++i];

  result.smallestRingSize = parseInt(lines[++i]);

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
