'use strict';

var React = require('react');
var createReactClass = require('create-react-class');
var $ = React.createElement;


var CheckBox = createReactClass({
  displayName: 'CheckBox',

  handleChange: function(event) {
    var val = event.target.checked;
    this.props.update(this.props.path, val, val);
  },
  render: function() {
    return $('input', {
      name: this.props.label,
      type: "checkbox",
      checked: this.props.value || false,
      onChange: this.handleChange });
  }
});

module.exports = CheckBox;

