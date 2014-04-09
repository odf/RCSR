'use strict';

var React = require('react');
var cc    = require('ceci-core');

var parse  = require('./parse-3dall');
var search = require('./search');


var $ = React.DOM;


var Application = React.createClass({
  render: function() {
    return $.div(null, 'RCSR');
  }
});

var app = Application();

React.renderComponent(app, document.getElementById('react-main'));
