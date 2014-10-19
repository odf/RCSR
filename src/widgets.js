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
    if (this.props.enableRemoteSelection)
      this.setState({
        cancelRemoteSelection:
        this.props.enableRemoteSelection(this.handleSelect)
      });
  },

  componentWillUnMount: function() {
    window.removeEventListener('resize', this.queryWindowSize);
    this.state.cancelRemoteSelection && this.state.cancelRemoteSelection();
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


var ActiveLink = React.createClass({
  displayName: 'ActiveLink',

  handleClick: function(event) {
    event.preventDefault();
    if (this.props.onClick)
      this.props.onClick(this.props.href);
  },
  componentDidMount: function() {
    this.getDOMNode().addEventListener('click', this.handleClick);
  },
  componentWillUnmount: function() {
    this.getDOMNode().removeEventListener('click', this.handleClick);
  },
  render: function() {
    return $.a({ className: this.props.className,
                 href: '#' + (this.props.href || '') },
               this.props.children);
  }
});


var WithToolTip = React.createClass({
  displayName: 'WithToolTip',

  getInitialState: function() {
    return {
      active  : false,
      position: null,
      blocked : null
    };
  },

  componentWillReceiveProps: function(props) {
    this.update('reset');
  },

  handleMouseEnter: function(event) {
    this.update('enter');
  },

  handleMouseLeave: function(event) {
    this.update('leave');
  },

  handleMouseMove: function(event) {
    this.update('move', { x: event.clientX, y: event.clientY });
  },

  handleTimout: function() {
    this.update('timeout');
  },

  timeout: function(duration) {
    return setTimeout(this.handleTimout, duration);
  },

  update: function(type, payload) {
    var active   = this.state.active;
    var position = this.state.position;
    var blocked  = this.state.blocked;
    var t        = this.props.timeoutValue || 500;

    if (type == 'reset') {
      if (blocked)
        clearTimeout(blocked);
      if (active)
        blocked = this.timeout(t);
      active = false;
    } else if (type == 'enter') {
      blocked = this.timeout(t);
    } else if (type == 'timeout') {
      blocked = null;
      active = true;
    } else if (type == 'move') {
      position = [payload.x + 10, payload.y + 5];
    } else if (type == 'leave') {
      if (blocked)
        clearTimeout(blocked);
      position = null;
      blocked  = null;
      active   = false;
    }

    this.setState({
      active  : active,
      position: position,
      blocked : blocked
    });
  },

  renderTip: function() {
    var pos = this.state.position;

    if (!this.state.active || pos == null)
      return $.span();
    else
      return $.div({ className: 'overlay highlight inlineBlock',
                     style: {
                       position: 'fixed',
                       left    : pos[0],
                       top     : pos[1]
                     }
                   },
                   this.props.content);
  },

  render: function() {
    return $.div({ className: this.props.className,
                   onMouseEnter: this.handleMouseEnter,
                   onMouseLeave: this.handleMouseLeave,
                   onMouseMove : this.handleMouseMove
                 },
                 this.props.children,
                 this.renderTip());
  }
});


module.exports = {
  Uploader   : Uploader,
  Tabs       : Tabs,
  ActiveLink : ActiveLink,
  WithToolTip: WithToolTip
};
