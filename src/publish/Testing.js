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
      selected: 0
    };
  },

  handleSelect: function(i) {
    if (i < this.props.children.length)
      this.setState({
        selected: i
      });
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
    return $.div({ className: 'TabsContainer' },
                 $.ul({ className: 'TabsList' },
                      this.props.labels.map(this.makeTab)),
                 $.div({ className: 'TabsPanel',
                         key: this.state.selected
                       },
                       this.props.children[this.state.selected]));
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
      info    : structures.length+' structures read from '+filename
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


var Testing = React.createClass({
  displayName: 'Testing',

  getInitialState: function() {
    return {
      type    : 'Nets',
      filename: null,
      text    : null,
      data    : null,
      issues  : null,
      info    : null,
      status  : null
    }
  },

  handleDataUpload: function(state) {
    this.setState(state);
    this.setState({ status: null });
  },

  renderDiagnostics: function() {
    return $.div(null, $.pre(null, this.state.issues || 'No problems found.'));
  },

  renderPreview: function() {
    if (this.state.data) {
      return components[this.state.type]({
        key : 'preview',
        data: this.state.data
      });
    } else
      return $.p({ key: 'nodata' }, 'No data loaded.');
  },

  publish: function() {
    var gh = github({
      baseURL  : 'https://api.github.com/repos/odf/RCSR-content/contents/',
      token    : credentials().token,
      userAgent: 'RCSR',
      origin   : 'http://rcsr.net'
    });

    this.setState({ status: 'publishing...' });

    gh.put('test/'+this.state.filename, this.state.text)
      .then(function(response) {
        if (response.ok)
          this.setState({ status: 'Published successfully!' });
        else
          this.setState({ status: 'Error: '+response.message });
      }.bind(this), function(error) {
        this.setState({ status: 'Error: '+error });
      }.bind(this));
  },

  renderPublishButton: function() {
    var creds = credentials();
    var label = 'Publish '+this.state.filename;
    var error, button;

    if (!this.state.filename)
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

  renderPublishStatus: function() {
    if (this.state.status) {
      return $.div(null,
                   $.h3(null, 'Status'),
                   $.p(null, this.state.status));
    } else
      return null;
  },

  renderPublishingScreen: function() {
    var creds = credentials();

    return $.div(null,
                 $.h3(null, 'Credentials'),
                 $.p(null, $.b(null, 'Your name: '), (creds.user || '-')),
                 $.p(null, 'Access token '
                     +(creds.okay ? '' : 'not')+' found'),
                 this.renderPublishButton(),
                 this.renderPublishStatus());
  },
  
  render: function() {
    return $.div(null,
                 $.h2(null, 'Testing and Publishing'),
                 $.p(null, this.state.info),
                 Tabs({ labels: ['Load Data',
                                 'Diagnostics',
                                 'Preview',
                                 'Publish'] },
                      DataUpload({ onUpload: this.handleDataUpload }),
                      this.renderDiagnostics(),
                      this.renderPreview(),
                      this.renderPublishingScreen()));
  }
});


module.exports = Testing;