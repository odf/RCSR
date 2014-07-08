'use strict';


var splitIntoLines = function(text) {
  return text.split(/\r?\n/);
};


var cleanupLine = function(line) {
  return line.trim().replace(/!.*$/, '');
};


var fixName = function(name) {
  return name == 'unk' ? '-' : name;
};


var parseInteger = function(s) {
  return parseInt(s);
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


var parseVertex = function(lines, startIndex) {
  var result = {};
  var tmp = lines[startIndex].split(/\s+/);

  result.name = tmp[0];
  result.coordination = parseInteger(tmp[1]);

  result.coordinates = lines[startIndex+1].split(/\s+/).map(parseFloat);

  return { result: result, nextLine: startIndex+2 };
};


var parseFace = function(lines, startIndex) {
  var result = {};
  var tmp = lines[startIndex].split(/\s+/);

  result.name = tmp[0];
  result.numberOfEdges = parseInteger(tmp[1]);

  result.coordinates = lines[startIndex+1].split(/\s+/).map(parseFloat);

  return { result: result, nextLine: startIndex+2 };
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

  result.symbol = lines[++i];
  result.dual   = fixName(lines[++i]);
  ++i;

  for (key in {
    otherSymbols: 0,
    names       : 0,
    otherNames  : 0,
    keywords    : 0
  })
  {
    tmp = parseSection(lines, i);
    result[key] = tmp.result;
    i = tmp.nextLine;
  }

  result.pointSymmetry    = lines[i];
  result.spacegroupSymbol = lines[++i];
  result.faceSymbol       = lines[++i];

  tmp = lines[++i].split(/\s+/).map(parseInteger);
  result.kindsOfVertex = tmp[0];
  result.kindsOfEdge   = tmp[1];
  result.kindsOfFace   = tmp[2];

  tmp = lines[++i].split(/\s+/).map(parseInteger);
  result.numberOfVertices = tmp[0];
  result.numberOfEdges    = tmp[1];
  result.numberOfFaces    = tmp[2];

  tmp = parseSection(lines, ++i, parseVertex);
  result.vertices = tmp.result;
  i = tmp.nextLine;

  tmp = parseSection(lines, i, parseFace);
  result.faces = tmp.result;
  i = tmp.nextLine;

  return { result: result, nextLine: i };
};


var checkStructure = function(poly) {
  var chi = poly.numberOfFaces - poly.numberOfEdges + poly.numberOfVertices;
  if (chi != 2)
    console.log("WARNING: " + poly.symbol +
                " - Euler characteristic is " + chi);
};


module.exports = function(text) {
  var lines = splitIntoLines(text).map(cleanupLine);
  var lineNo = 0;
  var result = [];
  var i, tmp;

  for (;;) {
    tmp = parseStructure(lines, lineNo);
    if (tmp == null)
      break;
    checkStructure(tmp.result);
    result.push(tmp.result);
    lineNo = tmp.nextLine;
  }

  return result;
};
