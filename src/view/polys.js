'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');

var common   = require('./common');
var search   = require('../search/polys');


var $ = React.DOM;

var laquo = '\u00ab';
var raquo = '\u00bb';


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
    var poly = this.props.polyhedron;
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


var maxDetails = 12;


var Results = React.createClass({
  displayName: 'Results',

  getInitialState: function() {
    return {
      selected: -1,
      detailsOffset: 0,
      symbolsOnly: false
    }
  },
  componentWillReceiveProps: function(props) {
    var n = (props.results || []).length == 1 ? 0 : -1;
    this.setState({
      selected: n,
      detailsOffset: 0
    });
  },
  select: function(choice) {
    var mods;

    if (choice == 'forward')
      mods = { detailsOffset: this.state.detailsOffset + maxDetails };
    else if (choice == 'backward')
      mods = { detailsOffset: this.state.detailsOffset - maxDetails };
    else if (choice == 'details')
      mods = { selected: -1, symbolsOnly: false };
    else if (choice == 'symbols')
      mods = { selected: -1, symbolsOnly: true };
    else
      mods = { selected: choice };

    this.setState(mods);
  },
  render: function() {
    var results = this.props.results || [];
    var n = results.length;
    var i = this.state.selected;
    var begin = this.state.detailsOffset;
    var end = Math.min(n, begin + maxDetails);
    var msg = 'Found ' + n + ' polyhedra matching your search';
    var polyhedron;

    var item = function(content) {
      return $.li({ className: 'fragment column' }, content);
    };

    var link = function(i, text) {
      return common.Link({ href: i, onClick: this.select }, text);
    }.bind(this);

    if (n < 1) {
      return $.p(null, msg + '.');
    } else if (i >= 0) {
      polyhedron = results[i];
      msg = 'Showing polyhedron ' + (i+1) + ' of ' + n +
        ' matching your search.';

      return $.div(null,
                   $.ul({ className: 'plainList' },
                        item(n > 1
                             ? link(-1, 'All Results') : 'All Results'),
                        item(i > 0
                             ? link(i-1, laquo + ' Previous') : 'Previous'),
                        item(i < n-1
                             ? link(i+1, 'Next ' + raquo) : 'Next')),
                   $.p(null, msg),
                   Polyhedron({ polyhedron: polyhedron }));
    } else if (this.state.symbolsOnly) {
      var resultList = results.map(function(poly, i) {
        return $.li({ className: 'fragment',
                      style: { width: '5em' },
                      key: poly.symbol },
                    common.Link({ href: i, onClick: this.select }, poly.symbol));
      }.bind(this));

      return $.div(null,
                   $.ul({ className: 'plainList' },
                        link('details', 'More Details')),
                   $.p(null, msg + '.'),
                   $.div(null,
                         $.ul({ className: 'plainList' }, resultList)));
    } else {
      if (begin > 0 || end < n)
        msg = msg + ', showing ' + (begin+1) + ' through ' + end;
      msg = msg + '.'

      return $.div(null,
                   $.ul({ className: 'plainList' },
                        item(link('symbols', 'Symbols Only')),
                        item(begin > 0
                             ? link("backward", laquo + ' Previous') 
                             : 'Previous'),
                        item(end < n
                             ? link("forward", 'Next ' + raquo)
                             : 'Next')),
                   $.p(null, msg),
                   common.makeTable(
                     ['pic', 'symbol', 'face symbol', 'symmetry',
                      'kinds of vertex', 'kinds of edge',
                      'kinds of face', '# vertices', '# edges',
                      '# faces'],
                     results.slice(begin, end).map(function(poly, i) {
                       return [
                         common.StructureImage({
                           prefix: 'Poly',
                           symbol: poly.symbol
                         }),
                         common.Link({ href: i + begin, onClick: this.select },
                                     poly.symbol),
                         poly.faceSymbol,
                         poly.pointSymmetry,
                         poly.kindsOfVertex,
                         poly.kindsOfEdge,
                         poly.kindsOfFace,
                         poly.numberOfVertices,
                         poly.numberOfEdges,
                         poly.numberOfFaces
                       ];
                     }.bind(this))
                   ));
    }
  }
});


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
                           Results({ results: this.state.results }))));
  }
});


module.exports = Polyhedra;
