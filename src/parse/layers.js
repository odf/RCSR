'use strict';


var unicodeInfinity = '\u221e';
var unicodeDummy = '\ufffd';


var splitIntoLines = function(text) {
  return text.split(/\r?\n/);
};


var cleanupLine = function(line) {
  return line.trim().replace(/!.*$/, '');
};


var parseInteger = function(s) {
  return parseInt(s);
};


var fixVertexSymbol = function(sym) {
  if (sym == 'inf' || sym == unicodeDummy)
    return unicodeInfinity;
  else
    return sym;
};


var parseSection = function(lines, startIndex, parseBlock) {
  var size  = parseInt(lines[startIndex]);
  var start = startIndex + 1;
  var next, result, i, tmp;

  if (!(size >= 0)) {
    var msg = 'expected a non-negative number on line '+(startIndex+1);
    throw new Error(msg);
  }

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

  //result.volume = cellVolume(result);

  return result;
};


var parseVertex = function(lines, startIndex) {
  var i = startIndex;
  var result = {};
  var tmp;

  tmp = lines[i].split(/\s+/);

  result.name = tmp[0];
  result.coordination = parseInteger(tmp[1]);

  result.coordinates = {
    numerical: lines[++i].split(/\s+/).map(parseFloat),
    symbolic : lines[++i]
  };

  tmp = lines[++i].split(/\s+/).map(function(s) { return parseInt(s); });
  result.coordinationSequence = tmp.slice(0, -1)
  result.cum10 = tmp.slice(-1)[0];
  result.symbol = fixVertexSymbol(lines[++i]);

  return { result: result, nextLine: ++i };
};


var parseStructure = function(lines, startIndex) {
  var result = { warnings: [] };
  var i, k, key, tmp;

  for (i = startIndex; i < lines.length && lines[i] != "start"; ++i)
    ;

  if (i == lines.length)
    return null;
  else if (i > startIndex)
    result.warnings.push('unrecognized trailing lines');

  result.serialNumber = parseInt(lines[++i]);

  if (result.serialNumber < 0)
    return null;

  result.symbol = lines[++i];
  ++i;

  try {
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

    result.group2d = lines[i];
    result.group3d = lines[++i];

    result.cell = parseCell(lines[++i]);

    tmp = lines[++i].split(/\s+/).map(parseInteger);
    result.kindsOfVertex = tmp[0];
    result.kindsOfEdge   = tmp[1];
    result.kindsOfFace   = tmp[2];

    tmp = parseSection(lines, i, parseVertex);
    result.vertices = tmp.result;
    i = tmp.nextLine;

  } catch(ex) {
    result.warnings.push('error while parsing symbol ('+ex+')');
  }

  return { result: result, nextLine: i };
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

    result.push(tmp.result);
    lineNo = tmp.nextLine;
  }

  return result;
};
