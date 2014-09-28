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

var nbsp = '\u00a0';


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


var sendToGithub = function(filename, text, onProgress, cb) {
  var gh = github({
    baseURL  : 'https://api.github.com/repos/odf/RCSR-content/contents/',
    token    : credentials().token,
    userAgent: 'RCSR',
    origin   : 'http://rcsr.net'
  });

  gh.put('test/'+filename, text, 'web commit', onProgress)
    .then(function(response) { cb(null, true); },
          function(error) { cb(error); });
};


var simulateSend = function(filename, text, onProgress, cb) {
  var total = text.length;
  var loaded = 0;

  var f = function() {
    clearTimeout(t);
    loaded = Math.min(loaded + 15000, total);
    onProgress({ loaded: loaded, total: total });

    if (loaded >= total) {
      var t1 = setTimeout(function() {
        clearTimeout(t1);
        cb(null, true);
      }, 500);
    } else {
      t = setTimeout(f, 100);
    }
  };

  var t = setTimeout(f, 100);

  console.log('simulating file upload');
};


var sendFile = function(filename, text, onProgress, cb) {
  if (credentials().user == 'Grimley Fiendish')
    simulateSend(filename, text, onProgress, cb);
  else
    sendToGithub(filename, text, onProgress, cb);
};


var ProgressBar = React.createClass({
  displayName: 'ProgressBar',

  render: function() {
    var percent = this.props.progress * 100;
    return $.span(null,
                  $.span({ className: 'meter hSep-1em',
                           style: { width: '200px' } },
                         $.span({ style: { width: percent+'%' } })),
                  Math.round(percent)+'%');
  }
});


var Publish = React.createClass({
  displayName: 'Publish',

  getInitialState: function() {
    return {
    }
  },

  handleProgress: function(filename, event) {
    var newState = {};
    newState[filename] = {
      status  : 'sending...',
      progress: event.loaded / event.total
    };
    this.setState(newState);
  },

  handleCompletion: function(filename, err, res) {
    var newState = {};
    newState[filename] = {
      status  : err ? 'error: '+err : 'sent successfully!',
      progress: null
    };
    this.setState(newState);
    if (!err)
      this.props.onFileSent(filename);
  },

  publishSingle: function(data) {
    sendFile(data.filename,
             data.text,
             function(event) {
               this.handleProgress(data.filename, event);
             }.bind(this),
             function(err, res) {
               this.handleCompletion(data.filename, err, res);
             }.bind(this));
  },

  publish: function() {
    this.props.data.forEach(this.publishSingle);
  },

  renderPublishButton: function() {
    var creds = credentials();
    var n     = this.props.data.length;
    var label = 'Publish '+n+' files';
    var error, button;

    if (n == 0)
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

  renderProgress: function(progress) {
    if (progress != null)
      return ProgressBar({ progress: progress });
  },

  renderPublishStatus: function() {
    return $.div(null,
                 $.h3(null, 'Status'),
                 this.props.data.map(function(data) {
                   var name = data.filename;
                   var fileState = this.state[name] || {};
                   var status = fileState.status || '';
                   var progress = fileState.progress;
                   var className = status.match(/^Error:/) ? 'error' : '';
                   return $.div({ key: name,
                                  className: className
                                },
                                name,
                                nbsp,
                                status,
                                this.renderProgress(progress));
                 }.bind(this)));
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
      active: 'Nets',
      Nets: {
      },
      Layers: {
      },
      Polyhedra: {
      }
    }
  },

  info: function(kind) {
    if (this.state[kind].data) {
      var props = this.state[kind];
      var n = props.data.length;
      return n+' '+(kind.toLowerCase()) +' from '+props.filename+'.';
    } else
      return 'No active data.';
  },

  publishingData: function() {
    var data = [];

    ['Nets', 'Layers', 'Polyhedra'].forEach(function(key) {
      var section = this.state[key];
      if (section.filename)
        data.push({
          filename: section.filename,
          text    : section.text
        });
    }.bind(this));

    return data;
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
      issues  : issues.join('\n')
    };
    this.setState(newState);
  },

  handleFileSent: function(filename) {
    console.log("File '"+filename+"' send successfully!");
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
                        data: this.publishingData(),
                        onFileSent: this.handleFileSent
                      })));
  }
});


module.exports = Testing;
