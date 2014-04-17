'use strict';

var React    = require('react');
var cc       = require('ceci-core');
var validate = require('plexus-validate');
var Form     = require('plexus-form');

var parse    = require('./parse-3dall');
var search   = require('./search');


var $ = React.DOM;

var laquo = '\u00ab';
var raquo = '\u00bb';


var loadFile = function(f) {
  var result = cc.defer();
  var reader = new FileReader();

  reader.onload = function(e) {
    result.resolve(e.target.result);
  };

  reader.readAsText(f);
  return result;
};


var Uploader = React.createClass({
  preventSubmit: function(event) {
    event.preventDefault();
  },
  loadFile: function(event) {
    var files = event.target.files;

    if (files[0]) {
      cc.go(function*() {
        this.props.handleData(yield loadFile(files[0]));
      }.bind(this)).then(null, function(ex) { throw ex; });
    }
  },
  render: function() {
    return $.form({ onSubmit: this.preventSubmit },
                  $.fieldset(null,
                             $.legend(null, 'Select a file'),
                             $.input({ type: 'file',
                                       onChange: this.loadFile })));
  }
});


var makeBooleanProperties = function(names) {
  var result = {};
  names.forEach(function(name) {
    result[name] = { title: name, type: 'boolean' };
  });
  return result;
};


var makeBoundsProperties = function(names) {
  var result = {};
  names.forEach(function(name) {
    result[name] = {
      title: name,
      type: 'string',
      pattern: /^(([<>]?=?\d+(\.\d+)?)|(\d+(\.\d+)?-\d+(\.\d+)?))$/
    };
  });
  return result;
};


var schema = {
  title: "Search nets",
  type: "object",
  required: [],
  properties: {
    symbol: {
      description: "Symbol",
      type: "object",
      properties: {
        mode: { enum: ["is", "contains", "begins with"] },
        text: { type: "string" }
      }
    },
    names: {
      description: "Names",
      type: "object",
      properties: {
        mode: { enum: ["is", "contains", "begins with"] },
        text: { type: "string" }
      }
    },
    keywords: {
      description: "Keywords",
      type: "object",
      properties: makeBooleanProperties([
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
        "simple net",
        "uniform net",
        "uniform tiling",
        "zeolite net"
      ])
    },
    modifiers: {
      description: "Modifiers",
      type: "object",
      properties: makeBooleanProperties([
        "include augmented (-a)",
        "exclude binary (-b) and catenated pair (-c)"
      ])
    },
    coordination: {
      title: "Coordination",
      type: "string",
      pattern: "^[1-9][0-9]*(,[1-9][0-9]*)*$"
    },
    bounds: {
      description: "Bounds",
      type: "object",
      properties: makeBoundsProperties([
        "density",
        "td10",
        "genus",
        "kinds of vertex",
        "kinds of edge",
        "kinds of face",
        "kinds of tile",
        "space group number",
        "smallest ring",
        "coordination",
        "order",
        "Dsize"
      ])
    }
  }
};

var conversions = {
  symbol: function(obj) {
    return obj.text && obj.text.length > 0 && obj;
  },
  names: function(obj) {
    return obj.text && obj.text.length > 0 && obj;
  },
  keywords: function(obj) {
    var result = [];
    for (var key in obj)
      if (obj[key])
        result.push(key);
    return result;
  },
  modifiers: function(obj) {
    return {
      include_a  : obj['include augmented (-a)'],
      exclude_b_c: obj['exclude binary (-b) and catenated pair (-c)']
    };
  },
  coordination: function(text) {
    return text.split(/,/).map(function(s) {
      return parseInt(s);
    });
  },
  bounds: function(data) {
    var result = {};
    var key, text, tmp;
    for (var key in data) {
      text = data[key];
      if (text.length > 0) {
        if (text.match(/-/)) {
          tmp = text.split('-');
          result[key] = {
            from: parseFloat(tmp[0]),
            to  : parseFloat(tmp[1])
          };
        } else if (text.match(/^<=/))
          result[key] = { to: parseFloat(text.slice(2)) };
        else if (text.match(/^</))
          result[key] = { to: parseFloat(text.slice(1)) };
        else if (text.match(/^>=/))
          result[key] = { from: parseFloat(text.slice(2)) };
        else if (text.match(/^>/))
          result[key] = { from: parseFloat(text.slice(1)) };
        else {
          tmp = parseFloat(text);
          result[key] = { from: tmp, to: tmp };
        }
      }
    }
    return result;
  }
};


var makeQuery = function(inputs) {
  var tmp;
  var result = {};
  for (var key in inputs) {
    if (conversions.hasOwnProperty(key))
      tmp = conversions[key](inputs[key]);
    else
      tmp = inputs[key];

    if (tmp != null)
      result[key] = tmp;
  }
  return result;
};


var SearchForm = React.createClass({
  render: function() {
    return Form({
      buttons: ['Search', 'Clear'],
      onSubmit: this.props.onSubmit,
      enterKeySubmits: 'Search',
      schema: schema,
      validate: validate,
      values: this.props.values
    });
  }
});


var makeLine = function(title, values) {
  return $.span(null,
                $.span({ className: 'bold' }, title + ': '),
                $.span(null, values.join(', ')))
};


var makeTable = function(headers, values) {
  return $.table(null,
                 $.thead(null,
                         $.tr(null, headers.map(function(s, i) {
                           return $.th({ key: i }, s);
                         }))),
                 $.tbody(null,
                         values.map(function(row) {
                           return $.tr(null, row.map(function(s, i) {
                             return $.td({ key: i }, s);
                           }));
                         })));
};


var makeIndexed = function(text, index) {
  return $.span(null, text, $.sub(null, '' + index));
};


var references = function(net) {
  var refs = [];

  for (title in { names: 0, 'key words': 0, references: 0 }) {
    key = title.replace(' ', '');
    if (net[key].length > 0)
      refs.push($.li({ key: key }, makeLine(title, net[key])));
  }

  return refs;
};


var f = function(val) {
  return val.toFixed(4);
};

var a = function(val) {
  return val.toFixed((val == 90 || val == 120) ? 1 : 4);
};


var properties = function(net) {
  return makeTable(['embed type', 'space group', 'volume',
                    'density', 'genus', 'td10'],
                   [[ net.embedType, net.spacegroupSymbol, f(net.cell.volume),
                      f(net.density), net.genus, net.td10 ]]);
};


var cell = function(net) {
  var cell = net.cell;
  return makeTable(['a', 'b', 'c', 'alpha', 'beta', 'gamma'],
                   [[ f(cell.a), f(cell.b), f(cell.c),
                      a(cell.alpha), a(cell.beta), a(cell.gamma) ]]);
};


var vertices = function(net) {
  return $.div(null,
               $.p(null, makeLine('vertices', [net.vertices.length])),
               makeTable(['vertex', 'cn', 'x', 'y', 'z', 'symbolic',
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
               makeTable([].concat('vertex',
                                   [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                                   .map(makeIndexed.bind(null, 'cs')),
                                   makeIndexed('cum', 10),
                                   'vertex symbol'),
                         net.vertices.map(function(v) {
                           return [].concat(v.name,
                                            v.coordinationSequence,
                                            v.cum10,
                                            v.symbol);
                         })));
};


var edges = function(net) {
  return $.div(null,
               $.p(null, makeLine('edges', [net.edges.length])),
               makeTable(['edge', 'x', 'y', 'z',
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
  return $.div(null,
               $.p(null, makeLine('tiling', [])),
               makeTable(['tiling', 'dual',
                          'vertices', 'edges', 'faces', 'tiles',
                          'D-symbol'],
                         [[ net.tiling, net.dual,
                            net.numberOfVertices, net.numberOfEdges,
                            net.numberOfFaces, net.numberOfTiles,
                            net.sizeOfDSymbol ]]));
};


var Net = React.createClass({
  render: function() {
    var net = this.props.net;

    return $.div(null,
                 $.h2(null, net.symbol),
                 $.ul({ className: 'plainList' }, references(net)),
                 properties(net),
                 cell(net),
                 vertices(net),
                 edges(net),
                 tiling(net));
  }
});


var Link = React.createClass({
  handleClick: function(event) {
    event.preventDefault();
    if (this.props.onClick)
      this.props.onClick(this.props.href);
  },
  componentDidMount: function() {
    this.getDOMNode().addEventListener('click', this.handleClick);
  },
  componentWillUnmount: function() {
    this.getDOMNode().removeEventListener('click', this.handleClick);
  },
  render: function() {
    return $.a({ className: this.props.className,
                 href: this.props.href },
               this.props.children);
  }
});


var Results = React.createClass({
  getInitialState: function() {
    return {
      selected: -1,
      symbolsOnly: true
    }
  },
  componentWillReceiveProps: function() {
    this.select(-1);
  },
  select: function(symbol) {
    this.setState({ selected: symbol });
  },
  render: function() {
    var results = this.props.results;
    var i = this.state.selected;
    var net;

    var link = function(i, text) {
      return $.li({ className: 'fragment column' },
                  Link({ href: i, onClick: this.select }, text));
    }.bind(this);

    if (i >= 0) {
      net = this.props.results[i];

      return $.div(null,
                   $.ul({ className: 'plainList' },
                        link(-1, 'All Results'),
                        link(i-1, laquo + ' Previous'),
                        link(i+1, 'Next ' + raquo)),
                   Net({ net: net }));
    } else if (this.state.symbolsOnly) {
      var resultList = (this.props.results || []).map(function(net, i) {
        return $.li({ className: 'fragment',
                      style: { width: '5em' },
                      key: net.symbol },
                    Link({ href: i, onClick: this.select }, net.symbol));
      }.bind(this));

      return $.ul({ className: 'plainList' }, resultList);
    } else {
      if (this.props.results && this.props.results.length > 0)
        return makeTable(['symbol', 'embed type', 'space group',
                          'number of vertices', 'genus', 'td10'],
                         (this.props.results || []).map(function(net, i) {
                           return [
                             net.symbol,
                             net.embedType,
                             net.spacegroupSymbol,
                             net.numberOfVertices,
                             net.genus,
                             net.td10
                           ];
                         }));
      else
        return $.span();
    }
  }
});


var Application = React.createClass({
  getInitialState: function() {
    return {
      data    : null,
      results : null
    }
  },
  handleUpload: function(data) {
    this.setState({ data: parse(data) });
  },
  onFormSubmit: function(inputs, value) {
    if (value == 'Search')
      this.setState({
        results: search(this.state.data, makeQuery(inputs)),
        reset  : false });
    else
      this.setState({
        reset: true
      });
  },
  select: function(symbol) {
    this.setState({ selected: symbol });
  },
  render: function() {
    var page;
    var values = this.state.reset ? {} : null;

    if (this.state.data) {
      page = $.div(null,
                   $.ul({ className: 'plainList columnBox' },
                        $.li({ className: 'column fixed' },
                             SearchForm({
                               onSubmit: this.onFormSubmit,
                               values: values
                             })),
                        $.li({ className: 'column' },
                             Results({ results: this.state.results }))));
    } else {
      page = $.div(null,
                   $.h2(null, 'Locate 3Dall.txt'),
                   Uploader({ handleData: this.handleUpload }));
    }

    return $.div(null,
                 $.h1(null, 'RCSR'),
                 page);
  }
});

var app = Application();

React.renderComponent(app, document.getElementById('react-main'));
