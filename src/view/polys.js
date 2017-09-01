'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');

var common   = require('./common');
var search   = require('../search/polys');
var widgets  = require('../widgets');


var $ = React.DOM;


var makeTabs = React.createFactory(widgets.Tabs);
var makeImage = React.createFactory(common.StructureImage);


var keywords = [
  "Archimedean",
  "cage",
  "Catalan",
  "cubic",
  "deltahedron",
  "icosahedral",
  "regular",
  "simple",
  "simplicial",
  "spacefilling",
  "weaving"
];


var schema = {
  title: "Search polyhedra",
  type: "object",
  required: [],
  properties: {
    symbol: {
      title: "Symbol",
      type: "object",
      properties: {
        mode: { enum: ["is", "contains", "begins with"] },
        text: { type: "string" }
      },
      "x-hints": {
        form: {
          classes: [ "inline", "flush" ]
        }
      }
    },
    names: {
      title: "Names",
      type: "object",
      properties: {
        mode: { enum: ["is", "contains", "begins with"] },
        text: { type: "string" }
      },
      "x-hints": {
        form: {
          classes: [ "inline", "flush" ]
        }
      }
    },
    keywords: {
      title: "Keywords",
      type: "object",
      properties: common.makeBooleanProperties(keywords),
      "x-hints": {
        form: {
          classes: ["inline", "narrow", "checkbox-left"]
        }
      }
    },
    bounds: {
      title: "Bounds",
      type: "object",
      properties: common.makeBoundsProperties([
        "number of vertices",
        "number of faces",
        "kinds of vertex",
        "kinds of edge",
        "kinds of face"
      ])
    }
  }
};


var properties = function(poly) {
  return common.makeTable(['symmetry', 'face symbol', 'dual', 'space group'],
                          [[ poly.pointSymmetry,
                             poly.faceSymbol,
                             poly.dual,
                             poly.spacegroupSymbol ]]);
};


var kinds = function(poly) {
  return common.makeTable(['kinds of vertex', 'kinds of edge', 'kinds of face'],
                          [[ poly.kindsOfVertex,
                             poly.kindsOfEdge,
                             poly.kindsOfFace ]]);
};


var numbers = function(poly) {
  return common.makeTable(['number of vertices',
                           'number of edges',
                           'number of faces'],
                          [[ poly.numberOfVertices,
                             poly.numberOfEdges,
                             poly.numberOfFaces ]]);
};


var f = function(val) {
  return val.toFixed(4);
};


var vertices = function(poly) {
  if (poly.vertices.length == 0)
    return $.div(null);

  return $.div(null,
               $.p(null, common.makeLine('vertices', [poly.vertices.length])),
               common.makeTable(['vertex', 'coordination', 'x', 'y', 'z'],
                                poly.vertices.map(function(v) {
                                  return [
                                    v.name,
                                    v.coordination,
                                    f(v.coordinates[0]),
                                    f(v.coordinates[1]),
                                    f(v.coordinates[2])
                                  ];
                                })));
};


var faces = function(poly) {
  if (poly.faces.length == 0)
    return $.div(null);

  return $.div(null,
               $.p(null, common.makeLine('faces', [poly.faces.length])),
               common.makeTable(['face', 'number of edges', 'x', 'y', 'z'],
                                poly.faces.map(function(face) {
                                  return [
                                    face.name,
                                    face.numberOfEdges,
                                    f(face.coordinates[0]),
                                    f(face.coordinates[1]),
                                    f(face.coordinates[2])
                                  ];
                                })));
};


var Polyhedron = React.createClass({
  displayName: 'Polyhedron',

  render: function() {
    var poly     = this.props.data;
    var path     = '/polyhedra/' + poly.symbol;
    var url      = 'http://rcsr.net' + path;
    var refKinds = ['names', 'keywords'];

    return $.div(null,
                 $.h2(null, poly.symbol),
                 $.p(null, makeImage({
                   prefix: 'Poly',
                   symbol: poly.symbol,
                   mayEnlarge: true
                 })),
                 $.p(null, 'RCSR reference: ', $.a({ href: path }, url)),
                 $.ul({ className: 'plainList' },
                      common.formatReferences(poly, refKinds, keywords)),
                 properties(poly),
                 kinds(poly),
                 numbers(poly),
                 vertices(poly),
                 faces(poly)
                );
  }
});


var polyTable = function(items, link) {
  return common.makeTable(
    ['pic', 'symbol', 'face symbol', 'symmetry',
     'kinds of vertex', 'kinds of edge',
     'kinds of face', '# vertices', '# edges',
     '# faces'],
    items.map(function(poly, i) {
      return [
        makeImage({
          prefix: 'Poly',
          symbol: poly.symbol
        }),
        link(i),
        poly.faceSymbol,
        poly.pointSymmetry,
        poly.kindsOfVertex,
        poly.kindsOfEdge,
        poly.kindsOfFace,
        poly.numberOfVertices,
        poly.numberOfEdges,
        poly.numberOfFaces
      ];
    })
  );
};


var Polyhedra = React.createClass({
  displayName: 'Polyhedra',

  mixins: [ common.viewer(search) ],

  render: function() {
    return $.div(null,
                 $.h1(null, 'Search Polyhedra'),
                 this.props.info ? $.p(null, '(' + this.props.info + ')') : null,
                 makeTabs({ labels: ['Search Form', 'Results'],
                            spreadThreshold: 800,
                            enableRemoteSelection: this.subscribe
                          },
                          this.renderSearchForm(schema),
                          this.renderResults('polyhedron', 'polyhedra',
                                             Polyhedron, polyTable)));
  }
});


module.exports = {
  search: Polyhedra,
  single: Polyhedron
};

