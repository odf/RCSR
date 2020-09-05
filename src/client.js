'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var Application = require('./app');

window.React = React; // wakes up the React Developer Tools

ReactDOM.render(
  React.createElement(Application, { path: document.location.pathname }),
  document.getElementById('react-main'));
