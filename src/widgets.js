'use strict';

var React = require('react');
var $ = React.DOM;


var Uploader = React.createClass({
  displayName: 'Uploader',

  componentDidMount: function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = this.props.accept;
    input.multiple = this.props.multiple;
    input.addEventListener('change', this.loadFile);
    this._input = input;
  },

  loadFile: function(event) {
    var files = event.target.files;
    var handleData = this.props.handleData;
    var binary = this.props.binary;

    for (var i = 0; i < files.length; ++i) {
      (function(i) {
        var file = files[i];
        var reader = new FileReader();

        reader.onload = function(event) {
          handleData(event.target.result, file.name);
        };

        if (binary)
          reader.readAsDataURL(file);
        else
          reader.readAsText(file);
      })(i);
    }
  },

  openSelector: function() {
    this._input.click();
  },

  render: function() {
    return $.button({ onClick: this.openSelector }, this.props.prompt || 'Add');
  }
});


var Tab = React.createClass({
  displayName: 'Tab',

  handleClick: function(event) {
    event.preventDefault();
    if (this.props.onSelect)
      this.props.onSelect(this.props.index);
  },
  componentDidMount: function() {
    this.getDOMNode().addEventListener('click', this.handleClick);
  },
  componentWillUnmount: function() {
    this.getDOMNode().removeEventListener('click', this.handleClick);
  },
  render: function() {
    return $.li({ className: this.props.className }, this.props.label);
  }
});


var Tabs = React.createClass({
  displayName: 'Tabs',

  getInitialState: function() {
    return {
      selected: 0,
      windowWidth: window.innerWidth
    };
  },

  queryWindowSize: function() {
    this.setState({
      windowWidth: window.innerWidth
    });
  },

  componentDidMount: function() {
    window.addEventListener('resize', this.queryWindowSize);
  },

  componentWillUnMount: function() {
    window.removeEventListener('resize', this.queryWindowSize);
  },

  handleSelect: function(i) {
    if (i < this.props.children.length) {
      this.setState({
        selected: i
      });
    }
  },

  makeTab: function(label, index) {
    var isSelected = index == this.state.selected;
    var classes = 'TabsItem' + (isSelected ? ' TabsSelected' : '');

    return Tab({ className: classes,
                 key      : index,
                 index    : index,
                 label    : label,
                 onSelect : this.handleSelect });
  },

  render: function() {
    var selected = this.state.selected;
    var threshold = this.props.spreadThreshold || 0;

    if (threshold > 0 && this.state.windowWidth > threshold)
      return $.ul({ className: 'plainList columnBox' },
                  this.props.children.map(function(component, i) {
                    return $.li({ key      : i,
                                  className: 'column fixed'
                                },
                                component);
                  }));
    else
      return $.div({ className: 'TabsContainer' },
                   $.ul({ className: 'TabsList' },
                        this.props.labels.map(this.makeTab)),
                   $.div({ className: 'TabsPanel' },
                         this.props.children.map(function(component, i) {
                           var d = (i == selected) ? 'block' : 'none';
                           return $.div({ key  : i,
                                          style: { display: d }
                                        },
                                        component);
                         })));
  }
});


module.exports = {
  Uploader: Uploader,
  Tabs    : Tabs
};
