'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');


var common   = require('./common');
var search   = require('../search/ribbons');
var widgets  = require('../widgets');


var $ = React.DOM;


var makeTabs = React.createFactory(widgets.Tabs);
var makeImage = React.createFactory(common.StructureImage);


var keywords = [
  "uniform",
  "weaving"
];


var schema = {
  title: "Search 1-Periodic",
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
        "kinds of vertex",
        "kinds of edge"
      ]),
      "x-hints": {
        form: {
          helpURL: "/help/bounds1d.html"
        }
      }
    }
  }};


var f = function(val) {
  return val.toFixed(4);
};

var a = function(val) {
  return val.toFixed((val == 90 || val == 120) ? 1 : 3);
};


var properties = function(ribbon) {
  return common.makeTable(['1 periodic group', '3 periodic group'],
                          [[ ribbon.group1d,
                             ribbon.group3d ]]);
};


var kinds = function(ribbon) {
  return common.makeTable(['kinds of vertex', 'kinds of edge'],
                          [[ ribbon.kindsOfVertex,
                             ribbon.kindsOfEdge ]]);
};


var cell = function(ribbon) {
  var cell = ribbon.cell;
  return common.makeTable(['a', 'b', 'c', 'alpha', 'beta', 'gamma'],
                          [[ f(cell.a), f(cell.b), f(cell.c),
                             a(cell.alpha), a(cell.beta), a(cell.gamma) ]]);
};


var makeIndexed = function(text, index) {
  return $.span(null, text, $.sub(null, '' + index));
};


var vertices = function(ribbon) {
  return $.div(null,
               $.p(null, common.makeLine('vertices', [ribbon.vertices.length])),
               common.makeTable(['vertex', 'coordination',
                                 'x', 'y', 'z'],
                                ribbon.vertices.map(function(v) {
                                  return [
                                    v.name,
                                    v.coordination,
                                    f(v.coordinates[0]),
                                    f(v.coordinates[1]),
                                    f(v.coordinates[2])
                                  ];
                                })));
};


var edges = function(ribbon) {
  return $.div(null,
               $.p(null, common.makeLine('edges', [ribbon.edges.length])),
               common.makeTable(['edge', 'x', 'y', 'z'],
                                ribbon.edges.map(function(e) {
                                  return [
                                    e.name,
                                    f(e.coordinates[0]),
                                    f(e.coordinates[1]),
                                    f(e.coordinates[2])
                                  ];
                                })));
};


var Ribbon = React.createClass({
  displayName: 'Ribbon',

  render: function() {
    var ribbon   = this.props.data;
    var path     = '/ribbons/' + ribbon.symbol;
    var url      = 'http://rcsr.net' + path;
    var refKinds = ['names', 'keywords'];

    return $.div(null,
                 $.h2(null, ribbon.symbol),
                 $.p(null, makeImage({
                   prefix: 'Ribbon',
                   symbol: ribbon.symbol,
                   mayEnlarge: true })),
                 $.p(null, 'RCSR reference: ', $.a({ href: path }, url)),
                 $.ul({ className: 'plainList' },
                      common.formatReferences(ribbon, refKinds, keywords)),
                 properties(ribbon),
                 kinds(ribbon),
                 cell(ribbon),
                 vertices(ribbon),
                 edges(ribbon),
                 $.a(
                   {
                     href: 'https://topcryst.com/s.php?ttdName=' + ribbon.symbol,
                     target: '_blank'
                   },
                   'Find occurrences...'
                 ));
  }
});


var ribbonTable = function(items, link) {
  return common.makeTable(
    ['pic', 'symbol', '1 periodic group', '3 periodic group',
     'kinds of vertex', 'kinds of edge'],
    items.map(function(ribbon, i) {
      return [
        makeImage({
          prefix: 'Ribbon',
          symbol: ribbon.symbol
        }),
        link(i),
        ribbon.group1d,
        ribbon.group3d,
        ribbon.kindsOfVertex,
        ribbon.kindsOfEdge
      ];
    })
  );
};


var Ribbons = React.createClass({
  displayName: 'Ribbons',

  mixins: [ common.viewer(search) ],

  render: function() {
    return $.div(null,
                 $.h1(null, 'Search 1-Periodic'),
                 this.props.info ? $.p(null, '(' + this.props.info + ')') : null,
                 makeTabs({ labels: ['Search Form', 'Results'],
                            spreadThreshold: 800,
                            enableRemoteSelection: this.subscribe
                          },
                          this.renderSearchForm(schema),
                          this.renderResults('structure', 'structures',
                                             Ribbon, ribbonTable)));
  }
});


module.exports = {
  search: Ribbons,
  single: Ribbon
};

