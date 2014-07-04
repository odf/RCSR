'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');

var search   = require('./search-polys');


var $ = React.DOM;

var laquo = '\u00ab';
var raquo = '\u00bb';


var Button = React.createClass({
  displayName: 'Button',

  render: function() {
    return $.form({ onSubmit: preventSubmit },
                  $.input({ type   : 'submit',
                            key    : this.props.value,
                            value  : this.props.value,
                            onClick: this.props.submit }));
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


var keywords = [
  "Archimedean",
  "cage",
  "Catalan",
  "cubic",
  "deltahedron",
  "icosahedral",
  "regular ",
  "simple",
  "simplicial",
  "space filling"
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
      properties: makeBooleanProperties(keywords),
      "x-hints": {
        form: {
          classes: ["inline", "narrow", "checkbox-left"]
        }
      }
    },
    bounds: {
      title: "Bounds",
      type: "object",
      properties: makeBoundsProperties([
        "number of vertices",
        "number of faces",
        "kinds of vertex",
        "kinds of edge",
        "kinds of face"
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
          result[key] = {
            to: parseFloat(text.slice(2))
          };
        else if (text.match(/^</))
          result[key] = {
            to: parseFloat(text.slice(1)),
            exclusive: true
          };
        else if (text.match(/^>=/))
          result[key] = {
            from: parseFloat(text.slice(2))
          };
        else if (text.match(/^>/))
          result[key] = {
            from: parseFloat(text.slice(1)),
            exclusive: true
          };
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
  displayName: 'SearchForm',

  render: function() {
    return Form({
      buttons: ['Search', 'Clear'],
      extraButtons: true,
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
                         values.map(function(row, i) {
                           return $.tr({ key: i }, row.map(function(s, i) {
                             return $.td({ key: i }, s);
                           }));
                         })));
};


var references = function(poly) {
  var refs = [];
  var key, title, val;

  for (key in { names: 0, keywords: 0 }) {
    title = key;
    val = poly[key];

    if (key == 'keywords') {
      title = 'key words';
      val = val.filter(function(x) { return keywords.indexOf(x) >= 0; });
    }

    if (val.length > 0)
      refs.push($.li({ key: key }, makeLine(title, val)));
  }

  return refs;
};


var properties = function(poly) {
  return makeTable(['symmetry', 'face symbol', 'space group'],
                   [[ poly.pointSymmetry,
                      poly.faceSymbol,
                      poly.spacegroupSymbol ]]);
};


var kinds = function(poly) {
  return makeTable(['kinds of vertex', 'kinds of edge', 'kinds of face'],
                   [[ poly.kindsOfVertex,
                      poly.kindsOfEdge,
                      poly.kindsOfFace ]]);
};


var numbers = function(poly) {
  return makeTable(['number of vertices', 'number of edges', 'number of faces'],
                   [[ poly.numberOfVertices,
                      poly.numberOfEdges,
                      poly.numberOfFaces ]]);
};


var f = function(val) {
  return val.toFixed(4);
};


var vertices = function(poly) {
  return $.div(null,
               $.p(null, makeLine('vertices', [poly.vertices.length])),
               makeTable(['vertex', 'coordination', 'x', 'y', 'z'],
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
               $.p(null, makeLine('faces', [poly.faces.length])),
               makeTable(['vertex', 'coordination', 'x', 'y', 'z'],
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


var PolyhedronImage = React.createClass({
  displayName: 'PolyhedronImage',

  getInitialState: function() {
    return { full: false };
  },
  toggle: function() {
    if (this.props.mayEnlarge)
      this.setState({ full: !this.state.full });
  },
  render: function() {
    var base = 'http://rcsr.net/webimgs/';
    var symbol = this.props.symbol;
    var src = base + (this.state.full
                      ? 'PolyPics/' + symbol + '.jpg'
                      : 'PolyPicsThumbs/' + symbol + 'T.jpg');

    if (this.props.mayEnlarge)
      return Link({ onClick: this.toggle }, $.img({ src: src, alt: '' }));
    else
      return $.img({ src: src, alt: '', onClick: this.toggle });
  }
});


var Polyhedron = React.createClass({
  displayName: 'Polyhedron',

  render: function() {
    var poly = this.props.polyhedron;

    return $.div(null,
                 $.h2(null, poly.symbol),
                 $.p(null, PolyhedronImage({
                   symbol: poly.symbol,
                   mayEnlarge: true
                 })),
                 $.ul({ className: 'plainList' }, references(poly)),
                 properties(poly),
                 kinds(poly),
                 numbers(poly),
                 vertices(poly),
                 faces(poly)
                );
  }
});


var Link = React.createClass({
  displayName: 'Link',

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
      return Link({ href: i, onClick: this.select }, text);
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
                    Link({ href: i, onClick: this.select }, poly.symbol));
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
                   makeTable(['pic', 'symbol', 'face symbol', 'symmetry',
                              'kinds of vertex', 'kinds of edge',
                              'kinds of face', '# vertices', '# edges',
                              '# faces'],
                             results.slice(begin, end).map(function(poly, i) {
                               return [
                                 PolyhedronImage({ symbol: poly.symbol }),
                                 Link({ href: i + begin, onClick: this.select },
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
      results: null
    }
  },
  onFormSubmit: function(inputs, value) {
    if (value == 'Search')
      this.setState({
        results: search(this.props.data, makeQuery(inputs)),
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
                           SearchForm({
                             onSubmit: this.onFormSubmit,
                             values  : this.state.reset ? {} : null
                           })),
                      $.li({ className: 'column' },
                           Results({ results: this.state.results }))));
  }
});


module.exports = Polyhedra;
