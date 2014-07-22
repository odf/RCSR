'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');

var common   = require('./common');
var search   = require('../search/nets');

var hellip   = '\u2026';

var $ = React.DOM;


var keywords = [
  "bipartite",
  "chiral",
  "clathrate",
  "good",
  "polar",
  "quasiregular net",
  "quasisimple tiling",
  "regular net",
  "self dual net",
  "semiregular net",
  "simple tiling",
  "uniform net",
  "uniform tiling",
  "zeolite net"
];


var schema = {
  title: "Search nets",
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
          classes: [ "inline", "flush" ],
          helpURL: "/help/symbol.html"
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
          classes: [ "inline", "flush" ],
          helpURL: "/help/names.html"
        }
      }
    },
    keywords: {
      title: "Keywords",
      type: "object",
      properties: common.makeBooleanProperties(keywords),
      "x-hints": {
        form: {
          classes: ["inline", "narrow", "checkbox-left"],
          helpURL: "/help/keywords.html"
        }
      }
    },
    modifiers: {
      title: "Modifiers",
      type: "object",
      properties: common.makeBooleanProperties([
        "include augmented (-a)",
        "exclude augmented (-a)",
        "exclude binary (-b...) and catenated (-c...)"
      ]),
      "x-hints": {
        form: {
          classes: ["wide", "checkbox-left"]
        }
      }
    },
    coordination: {
      title: "Coordination",
      type: "object",
      properties: {
        spec: {
          type: "string",
          pattern: "^[1-9][0-9]*(,[1-9][0-9]*)*$"
        }
      },
      "x-hints": {
        form: {
          helpURL: "/help/coordination.html"
        }
      }
    },
    bounds: {
      title: "Bounds",
      type: "object",
      properties: common.makeBoundsProperties([
        ["density"],
        ["td10"],
        ["genus"],
        ["kinds of vertex"],
        ["kinds of edge"],
        ["kinds of face"],
        ["kinds of tile"],
        "space group number",
        ["smallest ring"],
        ["order"],
        ["Dsize"]
      ])
    }
  }
};

var makeIndexed = function(text, index) {
  return $.span(null, text, $.sub(null, '' + index));
};


var f = function(val) {
  return val.toFixed(4);
};

var a = function(val) {
  return val.toFixed((val == 90 || val == 120) ? 1 : 3);
};


var properties = function(net) {
  return common.makeTable(
    ['embed type', 'space group', 'volume', 'density', 'genus', 'td10'],
    [[ net.embedType, net.spacegroupSymbol,
       f(net.cell.volume), f(net.density), net.genus, net.td10 ]]);
};


var cell = function(net) {
  var cell = net.cell;
  return common.makeTable(['a', 'b', 'c', 'alpha', 'beta', 'gamma'],
                          [[ f(cell.a), f(cell.b), f(cell.c),
                             a(cell.alpha), a(cell.beta), a(cell.gamma) ]]);
};


var vertices = function(net) {
  var showVertexSymbol = net.vertices.every(function(v) {
    return v.coordinationNumber <= 6;
  });

  return $.div(null,
               $.p(null, common.makeLine('vertices', [net.vertices.length])),
               common.makeTable(['vertex', 'cn', 'x', 'y', 'z', 'symbolic',
                                 'Wyckoff', 'symmetry', 'order'],
                                net.vertices.map(function(v) {
                                  return [
                                    v.name,
                                    v.coordinationNumber,
                                    f(v.coordinates.numerical[0]),
                                    f(v.coordinates.numerical[1]),
                                    f(v.coordinates.numerical[2]),
                                    v.coordinates.symbolic,
                                    v.wyckoff,
                                    v.symmetry,
                                    v.order
                                  ];
                                })),
               common.makeTable(
                 [].concat('vertex',
                           [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                           .map(makeIndexed.bind(null, 'cs')),
                           makeIndexed('cum', 10),
                           (showVertexSymbol ? 'vertex symbol' : [])),
                 net.vertices.map(function(v) {
                   return [].concat(v.name,
                                    v.coordinationSequence,
                                    v.cum10,
                                    (showVertexSymbol ? v.symbol : []));
                 })));
};


var edges = function(net) {
  return $.div(null,
               $.p(null, common.makeLine('edges', [net.edges.length])),
               common.makeTable(['edge', 'x', 'y', 'z',
                                 'symbolic', 'Wyckoff', 'symmetry'],
                                net.edges.map(function(e) {
                                  return [
                                    e.name,
                                    f(e.coordinates.numerical[0]),
                                    f(e.coordinates.numerical[1]),
                                    f(e.coordinates.numerical[2]),
                                    e.coordinates.symbolic,
                                    e.wyckoff,
                                    e.symmetry
                                  ];
                                })));
};


var tiling = function(net) {
  if (net.numberOfFaces > 0)
    return $.div(null,
                 $.p(null, common.makeLine('tiling', [])),
                 common.makeTable(['tiling', 'dual',
                                   'vertices', 'edges', 'faces', 'tiles',
                                   'D-symbol'],
                                  [[ net.tiling, net.dual,
                                     net.numberOfVertices, net.numberOfEdges,
                                     net.numberOfFaces, net.numberOfTiles,
                                     net.sizeOfDSymbol ]]));
  else
    return $.div();
};


var Net = React.createClass({
  displayName: 'Net',

  render: function() {
    var net = this.props.structure;
    var refKinds = ['names', 'keywords', 'references'];

    return $.div(null,
                 $.h2(null, net.symbol),
                 $.p(null, common.StructureImage({
                   prefix: 'Net',
                   symbol: net.symbol,
                   mayEnlarge: true })),
                 $.ul({ className: 'plainList' },
                      common.formatReferences(net, refKinds, keywords)),
                 properties(net),
                 cell(net),
                 vertices(net),
                 edges(net),
                 tiling(net));
  }
});


var netTable = function(items, link) {
  return common.makeTable(
    ['pic', 'symbol', 'embed type', 'space group', 'vertices',
     'edges', 'genus'],
    items.map(function(net, i) {
      return [
        common.StructureImage({
          prefix: 'Net',
          symbol: net.symbol
        }),
        link(i),
        net.embedType,
        net.spacegroupSymbol,
        net.numberOfVertices,
        net.numberOfEdges,
        net.genus
      ];
    })
  );
};


var Nets = React.createClass({
  displayName: 'Nets',

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
                 $.h1(null, 'Search Nets'),
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
                             type: 'net',
                             display: Net,
                             table: netTable,
                             results: this.state.results
                           }))));
  }
});


module.exports = Nets;