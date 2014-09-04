'use strict';

var React    = require('react');
var Immutable = require('immutable');

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
      type: "object",
      properties: {
        spec: {
          title: "Coordination",
          type: "string",
          pattern: "^[1-9][0-9]*([,; ][ ]*[1-9][0-9]*)*$",
          "x-hints": {
            form: {
              classes: ["important"],
              helpURL: "/help/coordination.html"
            }
          }
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
        ["space group number", "/help/spacegroup.html"],
        ["smallest ring"],
        ["order"],
        ["Dsize"]
      ]),
      "x-hints": {
        form: {
          helpURL: "/help/bounds.html"
        }
      }
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
    [[ net.get('embedType'), net.get('spacegroupSymbol'),
       f(net.getIn(['cell', 'volume'])), f(net.get('density')),
       net.get('genus'), net.get('td10') ]]);
};


var cell = function(net) {
  var cell = net.get('cell');
  return common.makeTable(
    ['a', 'b', 'c', 'alpha', 'beta', 'gamma'],
    [[ f(cell.get('a')), f(cell.get('b')), f(cell.get('c')),
       a(cell.get('alpha')), a(cell.get('beta')), a(cell.get('gamma')) ]]);
};


var vertexRow = function(v) {
  return [
    v.get('name'),
    v.get('coordinationNumber'),
    f(v.getIn(['coordinates', 'numerical', 0])),
    f(v.getIn(['coordinates', 'numerical', 1])),
    f(v.getIn(['coordinates', 'numerical', 2])),
    v.getIn(['coordinates', 'symbolic']),
    v.get('wyckoff'),
    v.get('symmetry'),
    v.get('order')
  ];
};


var vertices = function(net) {
  var showVertexSymbol = net.get('vertices').every(function(v) {
    return v.get('coordinationNumber') <= 6;
  });

  var vertexRowCS = function(v) {
    var t = Immutable.Sequence()
      .concat(v.get('name'), v.get('coordinationSequence'), v.get('cum10'))
      .toVector();
    return (showVertexSymbol ? t.push(v.get('symbol')) : t).toArray();
  };

  var keys = [
    'vertex', 'cn', 'x', 'y', 'z', 'symbolic', 'Wyckoff', 'symmetry', 'order'
  ];
  var keysCS = [].concat(
    'vertex',
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(makeIndexed.bind(null, 'cs')),
    makeIndexed('cum', 10),
    (showVertexSymbol ? 'vertex symbol' : []));

  var values = net.get('vertices').map(vertexRow).toArray();
  var valuesCS = net.get('vertices').map(vertexRowCS).toArray();

  var n = net.get('vertices').length;

  return $.div(null,
               $.p(null, common.makeLine('vertices', [n])),
               common.makeTable(keys, values),
               common.makeTable(keysCS, valuesCS));
};


var edgeRow = function(e) {
  return [
    e.get('name'),
    f(e.getIn(['coordinates', 'numerical', 0])),
    f(e.getIn(['coordinates', 'numerical', 1])),
    f(e.getIn(['coordinates', 'numerical', 2])),
    e.getIn(['coordinates', 'symbolic']),
    e.get('wyckoff'),
    e.get('symmetry')
  ];
};


var edges = function(net) {
  var keys = ['edge', 'x', 'y', 'z', 'symbolic', 'Wyckoff', 'symmetry'];
  var m = net.get('edges').length;
  var values = net.get('edges').map(edgeRow).toArray();

  return $.div(null,
               $.p(null, common.makeLine('edges', [m])),
               common.makeTable(keys, values));
};


var tiling = function(net) {
  if (net.get('numberOfFaces') == 0)
    return $.div();

  var keys = [
    'tiling', 'dual', 'vertices', 'edges', 'faces', 'tiles', 'D-symbol'
  ];
  var values = [
    'tiling', 'dual',
    'numberOfVertices', 'numberOfEdges', 'numberOfFaces', 'numberOfTiles',
    'sizeOfDSymbol'
  ].map(net.get.bind(net));

  return $.div(null,
               $.p(null, common.makeLine('tiling', [])),
               common.makeTable(keys, [values]));
};


var Net = React.createClass({
  displayName: 'Net',

  render: function() {
    var net      = Immutable.fromJS(this.props.data);
    var symbol   = net.get('symbol');
    var path     = '/nets/' + symbol;
    var url      = 'http://rcsr.net' + path;
    var refKinds = ['names', 'keywords', 'references'];

    return $.div(null,
                 $.h2(null, symbol),
                 $.p(null, common.StructureImage({
                   prefix: 'Net',
                   symbol: symbol,
                   mayEnlarge: true })),
                 $.p(null, 'RCSR reference: ', $.a({ href: path }, url)),
                 $.ul({ className: 'plainList' },
                      common.formatReferencesI(net, refKinds, keywords)),
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


module.exports = {
  search: Nets,
  single: Net
};

