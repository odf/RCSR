'use strict';

var React = require('react');
var createReactClass = require('create-react-class');
var $ = React.createElement;

var normalizer = require('./utils/normalizer');
var parser = require('./utils/parser');


var InputField = createReactClass({
  displayName: 'InputField',

  normalize: function(text) {
    return normalizer[this.props.type](text);
  },
  parse: function(text) {
    return parser[this.props.type](text);
  },
  handleChange: function(event) {
    var text = this.normalize(event.target.value);
    this.props.update(this.props.path, text, this.parse(text));
  },
  handleKeyPress: function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
    }
  },
  render: function() {
    return $('input', {
      type      : "text",
      name      : this.props.label,
      value     : this.props.value || '',
      onKeyPress: this.handleKeyPress,
      onChange  : this.handleChange });
  }
});

module.exports = InputField;

