'use strict';

var React       = require('react');
var agent       = require('superagent');
var cc          = require('ceci-core');

var parseNets   = require('./parse/nets');
var parseLayers = require('./parse/layers');
var parsePolys  = require('./parse/polys');

var Nets        = require('./view/nets');
var Layers      = require('./view/layers');
var Polyhedra   = require('./view/polys');


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
                      'Arizona State University'),
                 $.h2({ className: 'center' },
                      'Department of Applied Mathematics',
                      $.br(),
                      'Australian National University'),
                 $.h2({ className: 'center' },
                      'NCI Vizlab',
                      $.br(),
                      'Australian National University'),
                 $.h2({ className: 'center' },
                      'Department of Chemistry',
                      $.br(),
                      'University of California, Berkeley'));
  }
});


var Loader = React.createClass({
  displayName: 'Loader',

  getInitialState: function() {
    return {
      showMessage: false,
      data: null
    }
  },
  componentDidMount: function() {
    cc.go(function*() {
      yield cc.sleep(500);
      if (this.isMounted() && !this.state.data)
        this.setState({ showMessage: true });
    }.bind(this));
    cc.go(function*() {
      var data = yield this.props.deferred;
      if (this.isMounted())
        this.setState({ data: data, showMessage: false });
    }.bind(this)).then(null, function(ex) {
      alert(ex + '\n' + ex.stack);
    });
  },
  render: function() {
    if (this.state.data)
      return this.props.component({ data: this.state.data,
                                    info: this.props.info });
    else if (this.state.showMessage)
      return $.div(null, $.p(null, "Loading data..."));
    else
      return $.div();
  }
});


var parsers = {
  "Nets"     : parseNets,
  "Layers"   : parseLayers,
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


var builtinNetData = function(symbol) {
  return cc.go(function*() {
    var data, res;

    res = yield cc.nbind(agent.get)('/public/3dall.json');
    if (res.ok)
      data = JSON.parse(res.text);
    else {
      res = yield cc.nbind(agent.get)('/public/3dall.txt');
      if (res.ok)
        data = parseNets(res.text);
    }

    if (data) {
      if (symbol)
        return data.filter(function(net) { return net.symbol == symbol; })[0];
      else
        return data;
    } else
      alert('Could not read data for RCSR nets');
  });
};


var builtinLayerData = function() {
  return cc.go(function*() {
    var res = yield cc.nbind(agent.get)('/public/2dall.txt');
    if (res.ok)
      return parseLayers(res.text);
  });
};


var builtinPolyData = function() {
  return cc.go(function*() {
    var res = yield cc.nbind(agent.get)('/public/0dall.txt');
    if (res.ok)
      return parsePolys(res.text);
  });
};


var resolveRoute = function(path) {
  if (path.match(/^\/nets\//))
    return Loader({
      component: Nets.single,
      deferred: builtinNetData(path.replace(/^\/nets\//, ''))
    });
  else if (path == '/nets')
    return Loader({
      component: Nets.search,
      deferred: builtinNetData()
    });
  else if (path == '/layers')
    return Loader({
      component: Layers,
      deferred: builtinLayerData()
    });
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
                            $.li(null, $.a({ href: '/public/about.html' },
                                           'About')),
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
                     'This site is work in progress and will replace ',
                     $.a({ href: 'http://rcsr.anu.edu.au' },
                         'http://rcsr.anu.edu.au' ),
                     '. In case of difficulties, please contact ',
                     $.a({ href: 'mailto:support@rcsr.net' },
                         'support@rcsr.net'),
                     ''),
                 resolveRoute(this.props.path));
  }
});


React.renderComponent(Application({ path: document.location.pathname }),
                      document.getElementById('react-main'));
