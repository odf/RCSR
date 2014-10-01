'use strict';

var React       = require('react');

var Nets        = require('./view/nets');
var Layers      = require('./view/layers');
var Polyhedra   = require('./view/polys');

var loader      = require('./loader');
var credentials = require('./publish/credentials');
var Testing     = require('./publish/Testing');

var $ = React.DOM;


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


var Credentials = React.createClass({
  render: function() {
    var creds = credentials();

    return $.div(null,
                 $.h3(null, 'New Credentials'),
                 $.p(null, $.b(null, 'Your name: '), (creds.user || '-')),
                 $.p(null, 'Access token '+(creds.okay ? '' : 'not')+' found'));
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
    this.props.loader(this.handleLoaderEvent);
  },

  componentWillReceiveProps: function(props) {
    props.loader(this.handleLoaderEvent);
  },

  handleLoaderEvent: function(err, res) {
    if (err)
      alert(ex+'\n'+ex.stack);
    else if (this.isMounted()) {
      if (res == null)
        this.setState({ showMessage: true });
      else
        this.setState({ data: res, showMessage: false });
    }
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


var components = {
  'Nets'     : Nets.search,
  'Layers'   : Layers.search,
  'Polyhedra': Polyhedra.search
};


var resolveRoute = function(path) {
  if (credentials().isnew)
    return Credentials();
  else if (path == '/about')
    return Loader({
      component: About,
      loader   : loader('html', '/about.html')
    });
  else if (path == '/links')
    return Links();
  else if (path.match(/^\/nets\//))
    return Loader({
      component: Nets.single,
      loader   : loader('nets', path.replace(/^\/nets\//, ''))
    });
  else if (path == '/nets')
    return Loader({
      component: Nets.search,
      loader   : loader('nets')
    });
  else if (path.match(/^\/layers\//))
    return Loader({
      component: Layers.single,
      loader   : loader('layers', path.replace(/^\/layers\//, ''))
    });
  else if (path == '/layers')
    return Loader({
      component: Layers.search,
      loader   : loader('layers')
    });
  else if (path.match(/^\/polyhedra\//))
    return Loader({
      component: Polyhedra.single,
      loader   : loader('polyhedra', path.replace(/^\/polyhedra\//, ''))
    });
  else if (path == '/polyhedra')
    return Loader({
      component: Polyhedra.search,
      loader   : loader('polyhedra')
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
