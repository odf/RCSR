'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');

var common   = require('./common');
var search   = require('../search/polys');


var $ = React.DOM;


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
  "spacefilling"
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
    var poly = this.props.structure;
    var refKinds = ['names', 'keywords'];

    return $.div(null,
                 $.h2(null, poly.symbol),
                 $.p(null, common.StructureImage({
                   prefix: 'Poly',
                   symbol: poly.symbol,
                   mayEnlarge: true
                 })),
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
        common.StructureImage({
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

  getInitialState: function() {
    return {
      results: search(this.props.data, {})
    }
  },
  onFormSubmit: function(inputs, value) {
    if (value == 'Search')
      this.setState({
        results: search(this.props.data, common.makeQuery(inputs)),
        reset  : false });
    else
      this.setState({
        reset: true
      });
  },
  render: function() {
    return $.div(null,
                 $.h1(null, 'Search Polyhedra'),
                 this.props.info ? $.p(null, '(' + this.props.info + ')') : null,
                 $.ul({ className: 'plainList columnBox' },
                      $.li({ className: 'column fixed' },
                           common.SearchForm({
                             schema  : schema,
                             onSubmit: this.onFormSubmit,
                             values  : this.state.reset ? {} : null
                           })),
                      $.li({ className: 'column' },
                           common.Results({
                             type: 'polyhedron',
                             typePlural: 'polyhedra',
                             display: Polyhedron,
                             table: polyTable,
                             results: this.state.results
                           }))));
  }
});


module.exports = Polyhedra;
