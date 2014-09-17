'use strict';

var React       = require('react');
var agent       = require('superagent');
var cc          = require('ceci-core');

var validate    = require('plexus-validate');
var Form        = require('plexus-form');

var parseNets   = require('./parse/nets');
var parseLayers = require('./parse/layers');
var parsePolys  = require('./parse/polys');

var checkNets   = require('./check/nets');
var checkLayers = require('./check/layers');
var checkPolys  = require('./check/polys');

var Nets        = require('./view/nets');
var Layers      = require('./view/layers');
var Polyhedra   = require('./view/polys');

var github = require('./github-content');

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
        handleData(yield loadFile(files[0]), files[0].name);
      }).then(null, function(ex) { throw ex; });
    }
  },
  render: function() {
    return $.form({ onSubmit: preventSubmit,
                    style: { display: 'inline-block' } },
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
                 $.div(null,
                       $.img({ className: 'center',
                               src: '/images/CRC_sphere_pic.jpg' }),
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
                            'University of California, Berkeley')),
                 $.p({ className: 'center' }, 'Additional hosting by'),
                 $.h2({ className: 'center' },
                      'Berzelii Center EXSELENT',
                      $.br(),
                      'Stockholm University'));
  }
});


var Links = React.createClass({
  displayName: 'Links',

  render: function() {
    var links = [
      ['http://www.iza-structure.org/databases',
       'zeolite atlas (known zeolites)' ],
      ['http://epinet.anu.edu.au/home',
       'EPINET database of nets' ],
      ['http://www.hypotheticalzeolites.net',
       'hypothetical zeolites' ],
      ['http://www.crystallography.net',
       'predicted crystal structures' ],
      ['http://www.chem.monash.edu.au/staff/sbatten/interpen/index.html',
       'interpenetrating nets' ],
      ['http://www.ccdc.cam.ac.uk',
       'Cambridge structural database (CSD)' ],
      ['http://www.topos.ssu.samara.ru',
       'TOPOS topology analysis' ],
      ['http://gavrog.org',
       'Systre net analysis' ],
      ['http://www.crystalmaker.com',
       'CrystalMaker (structure visualization)' ],
      ['http://www.iucr.org',
       'International Union of Crystallography' ]
    ];

    return $.div({ className: 'article center' },
                 $.h1(null, 'RCSR Links Page'),
                 $.p(null,
                     'These are some links to related resources on the Web.'),
                 links.map(function(a, i) {
                   return $.a({ key: i, href: a[0] }, a[1], $.br());
                 }));
  }
});


var About = React.createClass({
  displayName: 'About',

  render: function() {
    return $.div({ className: 'article center' },
                 $.h1({ className: 'center' }, 'RCSR'),
                 $.div({
                   dangerouslySetInnerHTML: {
                     __html: this.props.data
                   }
                 }));
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
    this.loadData(this.props);
  },

  componentWillReceiveProps: function(props) {
    this.loadData(props);
  },

  loadData: function(props) {
    cc.go(function*() {
      yield cc.sleep(500);
      if (this.isMounted() && !this.state.data)
        this.setState({ showMessage: true });
    }.bind(this));
    cc.go(function*() {
      var data = yield props.deferred;
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
      return $.div(null, $.p(null, 'Loading data...'));
    else
      return $.div();
  }
});


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


var getCredentials = function() {
  var user  = localStorage.getItem('RCSR-admin-name');
  var token = localStorage.getItem('RCSR-admin-token');
  var isnew = localStorage.getItem('RCSR-admin-new-credentials') == 'true';
  var okay  = token && token.length == 40;

  localStorage.setItem('RCSR-admin-new-credentials', 'false');

  return {
    user : user,
    token: token,
    okay : okay,
    isnew: isnew
  };
};


var Credentials = React.createClass({
  render: function() {
    var credentials = getCredentials();

    return $.div(null,
                 $.h3(null, 'New Credentials'),
                 $.p(null, $.b(null, 'Your name: '),
                     (credentials.user || '-')),
                 $.p(null, 'Access token '
                     +(credentials.okay ? '' : 'not')+' found'));
  }
});


var Testing = React.createClass({
  displayName: 'Testing',

  getInitialState: function() {
    return {
      type: 'Nets',
      text: null,
      data: null,
      info: null,
      response: null
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

    this.setState({
      filename: filename,
      text    : text,
      data    : structures,
      issues  : issues.join('\n'),
      info    : structures.length+' structures read from '+filename
    });
  },

  renderUploadScreen: function() {
    return $.div(null,
                 $.form({ onChange: this.handleUploadFormChange },
                        $.p(null,
                            $.input({ type: 'radio', name: 'type',
                                      value: 'Nets',
                                      defaultChecked: true }),
                            $.label(null, 'Nets')),
                        $.p(null,
                            $.input({ type: 'radio', name: 'type',
                                      value: 'Layers' }),
                            $.label(null, 'Layers')),
                        $.p(null,
                            $.input({ type: 'radio', name: 'type',
                                      value: 'Polyhedra' }),
                            $.label(null, 'Polyhedra'))),
                 Uploader({ handleData: this.handleUploadData }),
                 $.p(null, this.state.info));
  },

  renderDiagnostics: function() {
    return $.div(null,
                 $.p(null, this.state.info),
                 $.pre(null, this.state.issues || 'No problems found.'));
  },

  renderPreview: function() {
    if (this.state.data) {
      return components[this.state.type]({
        key : 'preview',
        data: this.state.data,
        info: this.state.info
      });
    } else
      return $.p({ key: 'nodata' }, 'No data loaded.');
  },

  publish: function() {
    var gh = github({
      baseURL  : 'https://api.github.com/repos/odf/RCSR-content/contents/',
      token    : getCredentials().token,
      userAgent: 'RCSR',
      origin   : 'http://rcsr.net'
    });

    this.setState({ response: 'waiting for response...' });

    gh.put('test/'+this.state.filename, this.state.text)
      .then(function(response) {
        this.setState({ response: response });
      }.bind(this), function(error) {
        this.setState({ response: error + '\n' + error.stack });
      }.bind(this));
  },

  renderPublishingScreen: function() {
    var credentials = getCredentials();
    var label = 'Publish '+this.state.filename;
    var error;
    if (!this.state.filename)
      error = 'You have not loaded any data to publish.';
    else if (!credentials.okay)
      error = 'You cannot publish without a valid access token.';

    var button = (error ? $.p({ className: 'error' }, error) :
                  $.input({ type   : 'submit',
                            key    : label,
                            value  : label,
                            onClick: this.publish }));

    return $.div(null,
                 $.h3(null, 'Credentials'),
                 $.p(null, $.b(null, 'Your name: '), (credentials.user || '-')),
                 $.p(null, 'Access token '
                     +(credentials.okay ? '' : 'not')+' found'),
                 button,
                 $.pre(null, JSON.stringify(this.state.response, null, 4)));
  },
  
  render: function() {
    return $.div(null,
                 $.h2(null, 'Testing and Publishing'),
                 Tabs({ labels: ['Load Data',
                                 'Diagnostics',
                                 'Preview',
                                 'Publish'] },
                      this.renderUploadScreen(),
                      this.renderDiagnostics(),
                      this.renderPreview(),
                      this.renderPublishingScreen()));
  }
});


var htmlFromServer = function(path) {
  return cc.go(function*() {
    var res;

    res = yield cc.nbind(agent.get)(path);
    if (res.ok)
      return res.text;
    else
      alert('Could not load ' + path);
  });
};


var builtinData = function(type, jsonPath, txtPath, parse, symbol) {
  return cc.go(function*() {
    var data, res;

    res = yield cc.nbind(agent.get)(jsonPath);
    if (res.ok)
      data = JSON.parse(res.text);
    else {
      res = yield cc.nbind(agent.get)(txtPath);
      if (res.ok)
        data = parse(res.text);
    }

    if (data) {
      if (symbol)
        return data.filter(function(item) {
          return item.symbol == symbol;
        })[0];
      else
        return data;
    } else
      alert('Could not read data for RCSR ' + type);
  });
};


var builtinNetData = function(symbol) {
  return builtinData(
    'nets',
    '/data/3dall.json',
    '/data/3dall.txt',
    parseNets,
    symbol
  );
};


var builtinLayerData = function(symbol) {
  return builtinData(
    'layers',
    '/data/2dall.json',
    '/data/2dall.txt',
    parseLayers,
    symbol
  );
};


var builtinPolyData = function(symbol) {
  return builtinData(
    'polyhedra',
    '/data/0dall.json',
    '/data/0dall.txt',
    parsePolys,
    symbol
  );
};


var resolveRoute = function(path) {
  if (getCredentials().isnew)
    return Credentials();
  else if (path == '/about')
    return Loader({
      component: About,
      deferred: htmlFromServer('/about.html')
    });
  else if (path == '/links')
    return Links();
  else if (path.match(/^\/nets\//))
    return Loader({
      component: Nets.single,
      deferred: builtinNetData(path.replace(/^\/nets\//, ''))
    });
  else if (path == '/nets')
    return Loader({
      component: Nets.search,
      deferred: builtinNetData()
    });
  else if (path.match(/^\/layers\//))
    return Loader({
      component: Layers.single,
      deferred: builtinLayerData(path.replace(/^\/layers\//, ''))
    });
  else if (path == '/layers')
    return Loader({
      component: Layers.search,
      deferred: builtinLayerData()
    });
  else if (path.match(/^\/polyhedra\//))
    return Loader({
      component: Polyhedra.single,
      deferred: builtinPolyData(path.replace(/^\/polyhedra\//, ''))
    });
  else if (path == '/polyhedra')
    return Loader({
      component: Polyhedra.search,
      deferred: builtinPolyData()
    });
  else if (path == '/testing') {
    localStorage.setItem('RCSR-testing-known', true);
    return Testing();
  } else
    return Home();
};


var Application = React.createClass({
  displayName: 'Application',

  render: function() {
    var adminKnown = localStorage.getItem('RCSR-testing-known') == 'true';

    var links = [
      [ 'Home', '/' ], [ '|' ],
      [ 'About', '/about' ], [ '|' ],
      [ 'Links', '/links' ], [ '|' ],
      [ 'Nets', '/nets' ], [ '|' ],
      [ 'Layers', '/layers' ], [ '|' ],
      [ 'Polyhedra', '/polyhedra' ]
    ];

    if (adminKnown) {
      links.push([ '|' ]);
      links.push([ 'Testing', '/testing' ]);
    }

    return $.div({ key: this.props.path },
                 $.div({ className: 'header' },
                       $.img({ src: '/images/rcsr_logo.gif' }),
                       $.span({ className: 'logoText' }, 'RCSR')),
                 $.div({ className: 'navBar' },
                       $.span({ className: 'tagline' },
                              'Reticular Chemistry Structure Resource'),
                       $.ul({ className: 'pageLinks' },
                            links.map(function(item, i) {
                              var name = item[0];
                              var url = item[1];
                              var t = url ? $.a({ href: url }, name) : name;
                              return $.li({ key: i }, t);
                            }))),
                 resolveRoute(this.props.path));
  }
});


module.exports = Application;
