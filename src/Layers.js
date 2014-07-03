'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');


var $ = React.DOM;

var laquo = '\u00ab';
var raquo = '\u00bb';


var schema = {
  title: "Search layers",
  type: "object",
  required: []
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


var Results = React.createClass({
  displayName: 'Results',

  render: function() {
    return $.div(null, 'coming soon...');
  }
});


var Layers = React.createClass({
  displayName: 'Layers',

  getInitialState: function() {
    return {
      results: null
    }
  },
  onFormSubmit: function(inputs, value) {
  },
  render: function() {
    return $.div(null,
                 $.h1(null, 'Search Layers'),
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


module.exports = Layers;
