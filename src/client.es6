'use strict';

var React      = require('react');
var agent      = require('superagent');
var cc         = require('ceci-core');

var parseNets  = require('./parse/nets');
var parsePolys = require('./parse/polys');

var Nets       = require('./view/nets');
var Layers     = require('./view/layers');
var Polyhedra  = require('./view/polys');


window.React = React; // wakes up the React Developer Tools

var $ = React.DOM;


var loadFile = function(f) {
  var result = cc.defer();
  var reader = new FileReader();

  reader.onload = function(e) {
    result.resolve(e.target.result);
  };

  reader.readAsText(f);
  return result;
};


var preventSubmit = function(event) {
  event.preventDefault();
};


var Uploader = React.createClass({
  displayName: 'Uploader',

  loadFile: function(event) {
    var files = event.target.files;
    var handleData = this.props.handleData;

    if (files[0]) {
      cc.go(function*() {
        handleData(yield loadFile(files[0]));
      }).then(null, function(ex) { throw ex; });
    }
  },
  render: function() {
    return $.form({ onSubmit: preventSubmit },
                  $.fieldset(null,
                             $.legend(null, 'Select a file'),
                             $.input({ type: 'file',
                                       onChange: this.loadFile })));
  }
});


var Home = React.createClass({
  displayName: 'Home',

  render: function() {
    var greeting = 'Welcome to the Reticular Chemistry Structure Resource';

    return $.div({ className: 'homePage' },
                 $.h1({ className: 'center' }, greeting),
                 $.img({ className: 'center', 
                         src: '/public/images/CRC_sphere_pic.jpg' }),
                 $.h2({ className: 'center' },
                      'Department of Chemistry and Biochemistry',
                      $.br(),
                      'University of California, Los Angeles'),
                 $.h2({ className: 'center' },
                      'Department of Chemistry and Biochemistry',
                      $.br(),
                      'Arizona State University'),
                 $.h2({ className: 'center' },
                      'Department of Applied Mathematics',
                      $.br(),
                      'Australian National University'),
                 $.h2({ className: 'center' },
                      'NCI Vizlab',
                      $.br(),
                      'Australian National University'));
  }
});


var Loader = React.createClass({
  displayName: 'Loader',

  getInitialState: function() {
    return {
      data: null
    }
  },
  componentDidMount: function() {
    cc.go(function*() {
      var data = yield this.props.deferred;
      if (this.isMounted())
        this.setState({ data: data });
    }.bind(this)).then(null, function(ex) {
      alert(ex + '\n' + ex.stack);
    });
  },
  render: function() {
    if (this.state.data)
      return this.props.component({ data: this.state.data,
                                    info: this.props.info });
    else
      return $.div(null, $.p(null, "Loading data..."));
  }
});


var parsers = {
  "Nets"     : parseNets,
  "Layers"   : null,
  "Polyhedra": parsePolys
};


var components = {
  "Nets"     : Nets,
  "Layers"   : Layers,
  "Polyhedra": Polyhedra
};


var Testing = React.createClass({
  displayName: 'Testing',

  getInitialState: function() {
    return {
      type    : "Nets",
      deferred: null,
      info    : null
    }
  },
  handleChange: function(event) {
    this.setState({ type: event.target.value });
  },
  render: function() {
    if (this.state.deferred)
      return Loader({
        component: components[this.state.type],
        deferred : this.state.deferred,
        info     : this.state.info
      });
    else
      return $.div(null,
                   $.h2(null, 'Locate data file'),
                   $.form({ onChange: this.handleChange },
                          $.p(null,
                              $.input({ type: "radio", name: "type",
                                        value: "Nets",
                                        defaultChecked: true }),
                              $.label(null, "Nets")),
                          $.p(null,
                              $.input({ type: "radio", name: "type",
                                        value: "Layers" }),
                              $.label(null, "Layers")),
                          $.p(null,
                              $.input({ type: "radio", name: "type",
                                        value: "Polyhedra" }),
                              $.label(null, "Polyhedra"))),
                   Uploader({
                     handleData: function(data) {
                       this.setState({
                         deferred: parsers[this.state.type](data),
                         info    : 'user-defined data'
                       });
                     }.bind(this)
                   }));
  }
});


var builtinNetData = function() {
  return cc.go(function*() {
    var res = yield cc.nbind(agent.get)('public/3dall.txt');
    if (res.ok)
      return parseNets(res.text);
  });
};


var builtinPolyData = function() {
  return cc.go(function*() {
    var res = yield cc.nbind(agent.get)('public/0dall.txt');
    if (res.ok)
      return parsePolys(res.text);
  });
};


var resolveRoute = function(path) {
  if (path == '/nets')
    return Loader({
      component: Nets,
      deferred: builtinNetData()
    });
  else if (path == '/layers')
    return Layers();
  else if (path == '/polyhedra')
    return Loader({
      component: Polyhedra,
      deferred: builtinPolyData()
    });
  else if (path == '/testing')
    return Testing();
  else
    return Home();
};


var Application = React.createClass({
  displayName: 'Application',

  render: function() {
    return $.div({ key: this.props.path },
                 $.div(null,
                       $.img({ src: '/public/images/rcsr_logo.gif' }),
                       $.span({ className: 'logoText' }, 'RCSR (beta)')),
                 $.div({ className: 'navBar' },
                       $.span({ className: 'tagline' },
                              'Reticular Chemistry Structure Resource'),
                       $.ul({ className: 'pageLinks' },
                            $.li(null, $.a({ href: '/' }, 'Home')),
                            $.li(null, '|'),
                            $.li(null, $.a({ href: '/nets' }, 'Nets')),
                            $.li(null, '|'),
                            $.li(null, $.a({ href: '/layers' }, 'Layers')),
                            $.li(null, '|'),
                            $.li(null, $.a({ href: '/polyhedra' }, 'Polyhedra')),
                            $.li(null, '|'),
                            $.li(null, $.a({ href: '/testing' }, 'Testing'))
                           )),
                 $.p({ className: 'disclaimer' },
                     'This site is work in progress. ',
                     'In case of difficulties, please visit ',
                     $.a({ href: 'http://rcsr.anu.edu.au' },
                         'http://rcsr.anu.edu.au' )),
                 resolveRoute(this.props.path));
  }
});


React.renderComponent(Application({ path: document.location.pathname }),
                      document.getElementById('react-main'));
