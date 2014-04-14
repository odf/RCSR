'use strict';

var React    = require('react');
var cc       = require('ceci-core');
var validate = require('plexus-validate');
var Form     = require('plexus-form');

var parse    = require('./parse-3dall');
var search   = require('./search');


var $ = React.DOM;


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
    result[name] = { title: name, type: "boolean" };
  });
  return result;
};


var makeBoundsProperties = function(names) {
  var result = {};
  names.forEach(function(name) {
    result[name] = {
      title: name,
      type: "string",
      pattern: /^(([<>]?=?\d+(\.\d+)?)|(\d+(\.\d+)?-\d+(\.\d+)?))$/
    };
  });
  return result;
};


var schema = {
  title: "Search for nets",
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
      buttons: ['Cancel', 'Search'],
      onSubmit: this.props.onSubmit,
      schema: schema,
      validate: validate
    });
  }
});


var Application = React.createClass({
  getInitialState: function() {
    return {
      data: null,
      results: null
    }
  },
  handleUpload: function(data) {
    this.setState({ data: parse(data) });
  },
  onFormSubmit: function(inputs, value) {
    if (value == 'Search')
      this.setState({ results: search(this.state.data, makeQuery(inputs)) });
  },
  render: function() {
    var page;

    if (this.state.data) {
      var resultList = [];

      if (this.state.results)
        resultList = this.state.results.map(function(net) {
          return $.p({ key: net.symbol }, net.symbol);
        });

      page = $.div(null,
                   $.ul({ className: 'flexContainer' },
                        $.li({ className: 'flexItem' },
                             SearchForm({ onSubmit: this.onFormSubmit })),
                        $.li({ className: 'flexItem' },
                             resultList)));
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
