'use strict';

var React = require('react');
var cc    = require('ceci-core');

var parse  = require('./parse-3dall');
var search = require('./search');


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
    return $.div(null,
                 $.h2(null, 'Locate 3Dall.txt'),
                 $.form({ onSubmit: this.preventSubmit },
                        $.fieldset(null,
                                   $.legend(null, 'Select a file'),
                                   $.input({ type: 'file',
                                             onChange: this.loadFile }))));
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
      page = $.div(null, "Read " + this.state.data.length + " structures");
    else
      page = Uploader({ handleData: this.handleUpload });

    return $.div(null,
                 $.h1(null, 'RCSR'),
                 page);
  }
});

var app = Application();

React.renderComponent(app, document.getElementById('react-main'));
