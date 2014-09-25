'use strict';

var React       = require('react');
var cc          = require('ceci-core');

var parseNets   = require('../parse/nets');
var parseLayers = require('../parse/layers');
var parsePolys  = require('../parse/polys');

var checkNets   = require('../check/nets');
var checkLayers = require('../check/layers');
var checkPolys  = require('../check/polys');

var Nets        = require('../view/nets');
var Layers      = require('../view/layers');
var Polyhedra   = require('../view/polys');

var credentials = require('./credentials');
var github      = require('./github');

var $ = React.DOM;


var parsers = {
  'Nets'     : parseNets,
  'Layers'   : parseLayers,
  'Polyhedra': parsePolys
};


var checkers = {
  'Nets'     : checkNets,
  'Layers'   : checkLayers,
  'Polyhedra': checkPolys
};


var components = {
  'Nets'     : Nets.search,
  'Layers'   : Layers.search,
  'Polyhedra': Polyhedra.search
};


var Uploader = React.createClass({
  displayName: 'Uploader',

  loadFile: function(event) {
    var files = event.target.files;
    var handleData = this.props.handleData;
    var reader = new FileReader();

    reader.onload = function(event) {
      handleData(event.target.result, files[0].name);
    };

    if (files[0])
      reader.readAsText(files[0]);
  },

  render: function() {
    return $.input({ type: 'file', onChange: this.loadFile });
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
      active: [this.props.children[0]]
    };
  },

  handleSelect: function(i) {
    if (i < this.props.children.length) {
      var a = this.state.active.slice();
      a[i] = this.props.children[i];

      this.setState({
        selected: i,
        active  : a
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

    return $.div({ className: 'TabsContainer' },
                 $.ul({ className: 'TabsList' },
                      this.props.labels.map(this.makeTab)),
                 $.div({ className: 'TabsPanel' },
                       this.state.active.map(function(component, i) {
                         var d = (i == selected) ? 'block' : 'none';
                         return $.div({ key  : i,
                                        style: { display: d }
                                      },
                                      component);
                       })));
  }
});


var DataUpload = React.createClass({
  displayName: 'DataUpload',

  getInitialState: function() {
    return {
      type: 'Nets'
    }
  },

  handleUploadFormChange: function(event) {
    this.setState({ type: event.target.value });
  },

  handleUploadData: function(text, filename) {
    var structures = parsers[this.state.type](text);
    var type = this.state.type.toLowerCase();
    var issues = [];
    
    checkers[this.state.type](structures, function(s) {
      issues.push(s);
    });

    this.props.onUpload({
      type    : this.state.type,
      filename: filename,
      text    : text,
      data    : structures,
      issues  : issues.join('\n'),
      info    : structures.length+' '+type+' read from '+filename+'.'
    });
  },

  render: function() {
    return $.div(null,
                 $.h3(null, 'Kind of data'),
                 $.form({ onChange: this.handleUploadFormChange },
                        $.input({ type: 'radio', name: 'type',
                                  value: 'Nets',
                                  defaultChecked: true }),
                        $.label(null, 'Nets'),
                        $.input({ type: 'radio', name: 'type',
                                  value: 'Layers' }),
                        $.label(null, 'Layers'),
                        $.input({ type: 'radio', name: 'type',
                                  value: 'Polyhedra' }),
                        $.label(null, 'Polyhedra')),
                 $.h3(null, 'Choose a data file'),
                 Uploader({ handleData: this.handleUploadData }));
  }
});


var Publish = React.createClass({
  displayName: 'Publish',

  getInitialState: function() {
    return {
      status: null,
      progress: null
    }
  },

  handleProgress: function(event) {
    this.setState({ progress: event.loaded / event.total });
  },

  publish: function() {
    var gh = github({
      baseURL  : 'https://api.github.com/repos/odf/RCSR-content/contents/',
      token    : credentials().token,
      userAgent: 'RCSR',
      origin   : 'http://rcsr.net'
    });

    this.setState({ status: 'publishing...' });

    gh.put('test/'+this.props.filename,
           this.props.text,
           'web commit',
           this.handleProgress)
      .then(function(response) {
        this.setState({
          status: 'Published successfully!',
          progress: null
        });
      }.bind(this), function(error) {
        this.setState({
          status: 'Error: '+error,
          progress: null
        });
      }.bind(this));
  },

  renderPublishButton: function() {
    var creds = credentials();
    var label = 'Publish '+this.props.filename;
    var error, button;

    if (!this.props.filename)
      error = 'You have not loaded any data to publish.';
    else if (!creds.okay)
      error = 'You cannot publish without a valid access token.';

    if (error)
      button = $.p({ className: 'error' }, error);
    else
      button = $.input({ type   : 'submit',
                         key    : label,
                         value  : label,
                         onClick: this.publish });

    return $.div(null, $.h3(null, 'Publish'), button);
  },

  renderProgress: function() {
    if (this.state.progress == null)
      return null;

    var percent = this.state.progress * 100;
    return $.span(null,
                  $.span({ className: 'meter hSep-1em',
                           style: { width: '200px' } },
                         $.span({ style: { width: percent+'%' } })),
                  Math.round(percent)+'%');
  },

  renderPublishStatus: function() {
    if (!this.state.status)
      return null;

    var className = this.state.status.match(/^Error:/) ? 'error' : '';

    return $.div(null,
                 $.h3(null, 'Status'),
                 $.span({ className: className },
                        this.state.status,
                        this.renderProgress()));
  },

  render: function() {
    var creds = credentials();

    return $.div(null,
                 $.h3(null, 'Credentials'),
                 $.p(null, $.b(null, 'Your name: '), (creds.user || '-')),
                 $.p(null, 'Access token '
                     +(creds.okay ? '' : 'not')+' found'),
                 this.renderPublishButton(),
                 this.renderPublishStatus());
  }
});


var Testing = React.createClass({
  displayName: 'Testing',

  getInitialState: function() {
    return {
      info: 'No active data.',
      active: 'Nets',
      Nets: {
        filename: null,
        text    : null,
        data    : null,
        issues  : null
      },
      Layers: {
        filename: null,
        text    : null,
        data    : null,
        issues  : null
      },
      Polyhedra: {
        filename: null,
        text    : null,
        data    : null,
        issues  : null
      }
    }
  },

  handleUploadFormChange: function(event) {
    if (event.target.name == 'type')
      this.setState({ active: event.target.value });
  },

  handleDataUpload: function(kind, text, filename) {
    var structures = parsers[kind](text);
    var type = kind.toLowerCase();
    var issues = [];
    var newState = {};

    checkers[kind](structures, function(s) {
      issues.push(s);
    });

    newState[kind] = {
      filename: filename,
      text    : text,
      data    : structures,
      issues  : issues.join('\n'),
    };
    this.setState(newState);
  },

  info: function(kind) {
    if (this.state[kind].data) {
      var props = this.state[kind];
      var n = props.data.length;
      return n+' '+(kind.toLowerCase()) +' from '+props.filename+'.';
    } else
      return 'No active data.';
  },

  renderUploadSection: function(kind) {
    var handleUpload = this.handleDataUpload.bind(null, kind);
    var message = this.info(kind);

    return $.div({ key: kind },
                 $.h2(null, kind),
                 $.p(null, 
                     $.input({ type: 'radio', name: 'type',
                               value: kind,
                               defaultChecked: kind == 'Nets' }),
                     $.span(null, message)),
                 Uploader({ handleData: handleUpload }));
  },

  renderLoadData: function() {
    return $.form({ onChange: this.handleUploadFormChange },
                  ['Nets', 'Layers', 'Polyhedra'].map(this.renderUploadSection));
  },

  renderDiagnostics: function() {
    var section = this.state[this.state.active];

    return $.div(null, $.pre(null, section.issues || 'No problems found.'));
  },

  renderPreview: function() {
    var section = this.state[this.state.active];

    if (section.data) {
      return components[this.state.active]({
        key : 'preview',
        data: section.data
      });
    } else
      return $.p({ key: 'nodata' }, 'Nothing yet to preview.');
  },

  render: function() {
    var section = this.state[this.state.active];

    return $.div(null,
                 $.h2(null, 'Testing and Publishing'),
                 $.p(null, this.info(this.state.active)),
                 Tabs({ labels: ['Load Data',
                                 'Diagnostics',
                                 'Preview',
                                 'Publish'] },
                      this.renderLoadData(),
                      this.renderDiagnostics(),
                      this.renderPreview(),
                      Publish({
                        filename: section.filename,
                        text    : section.text
                      })));
  }
});


module.exports = Testing;
