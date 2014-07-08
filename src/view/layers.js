'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');


var common   = require('./common');
var search   = require('../search/layers');


var $ = React.DOM;


var keywords = [
  "regular",
  "Archimedean",
  "isohedral",
  "plane",
  "layer"
];


var schema = {
  title: "Search layers",
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
    coordination: {
      title: "Coordination",
      type: "object",
      properties: {
        spec: {
          type: "string",
          pattern: "^[1-9][0-9]*(,[1-9][0-9]*)*$"
        }
      }
    },
    bounds: {
      title: "Bounds",
      type: "object",
      properties: common.makeBoundsProperties([
        "kinds of vertex"
      ])
    }
  }};


var f = function(val) {
  return val.toFixed(4);
};

var a = function(val) {
  return val.toFixed((val == 90 || val == 120) ? 1 : 3);
};


var properties = function(layer) {
  return common.makeTable(['2 periodic group', '3 periodic group'],
                          [[ layer.group2d,
                             layer.group3d ]]);
};


var kinds = function(layer) {
  return common.makeTable(['kinds of vertex', 'kinds of edge', 'kinds of face'],
                          [[ layer.kindsOfVertex,
                             layer.kindsOfEdge,
                             layer.kindsOfFace ]]);
};


var cell = function(layer) {
  var cell = layer.cell;
  return common.makeTable(['a', 'b', 'c', 'alpha', 'beta', 'gamma'],
                          [[ f(cell.a), f(cell.b), f(cell.c),
                             a(cell.alpha), a(cell.beta), a(cell.gamma) ]]);
};


var makeIndexed = function(text, index) {
  return $.span(null, text, $.sub(null, '' + index));
};


var vertices = function(layer) {
  return $.div(null,
               $.p(null, common.makeLine('vertices', [layer.vertices.length])),
               common.makeTable(['vertex', 'coordination',
                                 'x', 'y', 'z', 'symbolic'],
                                layer.vertices.map(function(v) {
                                  return [
                                    v.name,
                                    v.coordination,
                                    f(v.coordinates.numerical[0]),
                                    f(v.coordinates.numerical[1]),
                                    f(v.coordinates.numerical[2]),
                                    v.coordinates.symbolic
                                  ];
                                })),
               common.makeTable(
                 [].concat('vertex',
                           [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                           .map(makeIndexed.bind(null, 'cs')),
                           makeIndexed('cum', 10),
                           'vertex symbol'),
                 layer.vertices.map(function(v) {
                   return [].concat(v.name,
                                    v.coordinationSequence,
                                    v.cum10,
                                    v.symbol);
                 })));
};


var Layer = React.createClass({
  displayName: 'Layer',

  render: function() {
    var layer = this.props.structure;
    var refKinds = ['names', 'keywords'];

    return $.div(null,
                 $.h2(null, layer.symbol),
                 $.p(null, common.StructureImage({
                   prefix: 'Layer',
                   symbol: layer.symbol,
                   mayEnlarge: true })),
                 $.ul({ className: 'plainList' },
                      common.formatReferences(layer, refKinds, keywords)),
                 properties(layer),
                 kinds(layer),
                 cell(layer),
                 vertices(layer));
  }
});


var layerTable = function(items, link) {
  return common.makeTable(
    ['pic', 'symbol', '2 periodic group', '3 periodic group',
     'kinds of vertex', 'kinds of edge', 'kinds of face'],
    items.map(function(layer, i) {
      return [
        common.StructureImage({
          prefix: 'Layer',
          symbol: layer.symbol
        }),
        link(i),
        layer.group2d,
        layer.group3d,
        layer.kindsOfVertex,
        layer.kindsOfEdge,
        layer.kindsOfFace
      ];
    })
  );
};


var Layers = React.createClass({
  displayName: 'Layers',

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
                 $.h1(null, 'Search Layers'),
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
                             type: 'layer',
                             display: Layer,
                             table: layerTable,
                             results: this.state.results
                           }))));
  }
});


module.exports = Layers;
