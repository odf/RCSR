'use strict';

var React = require('react');
var cc    = require('ceci-core');

var parse  = require('./parse-3dall');
var search = require('./search');


var $ = React.DOM;


var setIn = function(obj, key, val) {
  var result = {};
  for (var k in obj)
    result[k] = obj[k];
  result[key] = val;
  return result;
};


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


var InputField = React.createClass({
  handleChange: function(event) {
    this.props.update(this.props.path, event.target.value);
  },
  handleKeyPress: function(event) {
    if (event.keyCode == 13)
      event.preventDefault();
  },
  render: function() {
    var label = this.props.label;
    return $.p({ key: label },
               label ? $.label(null, label) : $.span(),
               label ? $.br() : $.span(),
               $.input({ type      : "text",
                         value     : this.props.value,
                         onKeyPress: this.handleKeyPress,
                         onChange  : this.handleChange }));
  }
});


var SearchForm = React.createClass({
  getInitialState: function() {
    return {
      data: {}
    }
  },
  preventSubmit: function(event) {
    event.preventDefault();
  },
  handleSubmit: function(event) {
    console.log(JSON.stringify(this.state.data), event.target.value);
  },
  update: function(path, value) {
    this.setState({
      data: setIn(this.state.data, path, value)
    });
  },
  render: function() {
    var buttons =
      (this.props.buttons || ['Cancel', 'Submit']).map(function(value) {
        return $.input({ type   : 'submit',
                         key    : value,
                         value  : value,
                         onClick: this.handleSubmit })
      }.bind(this));

    return $.form({ onSubmit: this.preventSubmit },
                  $.fieldset(null,
                             InputField({ label : 'Symbol',
                                          value : this.state.data['symbol'],
                                          path  : 'symbol',
                                          update: this.update
                                        })),
                  buttons);
  }
});


var Application = React.createClass({
  getInitialState: function() {
    return {
      data: null
    }
  },
  handleUpload: function(data) {
    this.setState({ data: parse(data) });
  },
  render: function() {
    var page;

    if (this.state.data)
      page = $.div(null,
                   "Read " + this.state.data.length + " structures",
                   $.h2(null, 'Search nets'),
                   SearchForm());
    else
      page = $.div(null,
                   $.h2(null, 'Locate 3Dall.txt'),
                   Uploader({ handleData: this.handleUpload }));

    return $.div(null,
                 $.h1(null, 'RCSR'),
                 page);
  }
});

var app = Application();

React.renderComponent(app, document.getElementById('react-main'));
