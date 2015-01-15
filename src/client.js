'use strict';

var React = require('react');
var Application = require('./app');

window.React = React; // wakes up the React Developer Tools

React.render(
  React.createElement(Application, { path: document.location.pathname }),
  document.getElementById('react-main'));
