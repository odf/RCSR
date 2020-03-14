'use strict';

var React       = require('react');

var Nets        = require('./view/nets');
var Layers      = require('./view/layers');
var Ribbons     = require('./view/ribbons');
var Polyhedra   = require('./view/polys');

var loader      = require('./loader');
var Deferred    = require('./Deferred');
var credentials = require('./publish/credentials');
var Testing     = require('./publish/Testing');

var $ = React.DOM;


var partnerLogo = function(src) {
  var args = [].slice.call(arguments, 1);
  var captionArgs = [].concat.apply(
    [null],
    args.map(function(x) { return [$.br(), x]; })).slice(1);

  return $.figure(null,
                  $.img({ src: src }),
                  $.figcaption.apply(null, captionArgs));
};


var Home = React.createClass({
  displayName: 'Home',

  render: function() {
    var greeting = 'Welcome to the Reticular Chemistry Structure Resource';

    return $.div(null,
                 $.div({ className: 'homePageLogo' },
                       $.img({ src: '/images/netcentermof.png' }),
                       $.p(null, greeting)),
                 $.div({ className: 'partnerLogos', style: { clear: 'both' } },
                       partnerLogo('/images/asu-logo.svg',
                                   'School of Molecular Sciences,',
                                   'Arizona State University'),
                       partnerLogo('/images/anu-logo.svg',
                                   'Department of Applied Mathematics,',
                                   'Australian National University'),
                       partnerLogo('/images/nci-logo.svg',
                                   'NCI Vizlab,',
                                   'Australian National University'),
                       partnerLogo('/images/ucb-logo.svg',
                                   'College of Chemistry,',
                                   'University of California, Berkeley')
                      ),
                 $.p({ className: 'center' },
                     'Additional hosting by'),
                 $.h2({ className: 'center' },
                      'Berzelii Center EXSELENT',
                      $.br(),
                      'Stockholm University'));
  }
});


var makeLink = function(a, k) {
  if (a.length > 2)
    return $.p({ key: k },
               a[1]+': ',
               makeLink([a[0], a[2]], k));
  else
    return $.a({ key: k, href: a[0] }, a[1], $.br());
};


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
      ['https://topospro.com',
       'TOPOS topology analysis' ],
      ['http://gavrog.org',
       'Systre net analysis' ],
      ['http://www.crystalmaker.com',
       'CrystalMaker (structure visualization)' ],
      ['http://www.iucr.org',
       'International Union of Crystallography' ],
      ['/downloads/OKeeffeLecturesLR.zip',
       'O\'Keeffe lectures', 'download (ZIP file, 25MB)'],
      ['/downloads/TouristGuide.pdf',
       'A tourist guide to the RCSR', 'download (PDF file, 12MB)']
    ];

    return $.div(
      null,
      $.h1(null, 'RCSR Links Page'),
      $.div({ className: 'article center' },
            $.p(null, 'These are some links to related resources on the Web.'),
            links.map(makeLink)));
  }
});


var Systre = React.createClass({
  displayName: 'Systre',

  render: function() {
    var links = [
      ['/downloads/Systre-19.6.0.jar',
       'Latest Systre executable (19.6.0)',
       'download (1.6MB)'],
      ['/downloads/RCSRnets-2019-06-01.cgd',
       'Systre input data (.cgd) for RCSR nets',
       'download (1.8MB)'],
      ['/downloads/RCSRnets-2019-06-01.arc',
       'Systre archive file (.arc) for RCSR nets',
       'download (2.2MB)']
    ];

    return $.div(null,
                 $.h1(null, 'RCSR Systre Page'),
                 $.div({ className: 'article center' },
                       'RCSR data as of June 1, 2019'),
                 $.div({ className: 'article center' },
                       links.map(makeLink)));
  }
});


var About = React.createClass({
  displayName: 'About',

  render: function() {
    return $.div(null,
                 $.h1(null, 'About RCSR'),
                 $.div({
                   className: 'article center',
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
                 $.p(null, 'Access token '+(creds.okay ? '' : 'not')+' found'),
                 creds.simulate ? 'Publishing will be simulated.' : '');
  }
});


var resolveRoute = function(path) {
  if (credentials().isnew)
    return React.createElement(Credentials);
  else if (path == '/about')
    return React.createElement(Deferred, {
      component: About,
      loader   : loader('html', '/about.html')
    });
  else if (path == '/links')
    return React.createElement(Links);
  else if (path == '/systre')
    return React.createElement(Systre);
  else if (path.match(/^\/nets\//))
    return React.createElement(Deferred, {
      component: Nets.single,
      loader   : loader('nets', path.replace(/^\/nets\//, ''))
    });
  else if (path == '/nets')
    return React.createElement(Deferred, {
      component: Nets.search,
      loader   : loader('nets')
    });
  else if (path.match(/^\/layers\//))
    return React.createElement(Deferred, {
      component: Layers.single,
      loader   : loader('layers', path.replace(/^\/layers\//, ''))
    });
  else if (path == '/layers')
    return React.createElement(Deferred, {
      component: Layers.search,
      loader   : loader('layers')
    });
  else if (path.match(/^\/ribbons\//))
    return React.createElement(Deferred, {
      component: Ribbons.single,
      loader   : loader('ribbons', path.replace(/^\/ribbons\//, ''))
    });
  else if (path == '/ribbons')
    return React.createElement(Deferred, {
      component: Ribbons.search,
      loader   : loader('ribbons')
    });
  else if (path.match(/^\/polyhedra\//))
    return React.createElement(Deferred, {
      component: Polyhedra.single,
      loader   : loader('polyhedra', path.replace(/^\/polyhedra\//, ''))
    });
  else if (path == '/polyhedra')
    return React.createElement(Deferred, {
      component: Polyhedra.search,
      loader   : loader('polyhedra')
    });
  else if (path == '/testing') {
    localStorage.setItem('RCSR-testing-known', true);
    return React.createElement(Deferred, {
      component: Testing,
      loader   : loader('all')
    });
  } else
    return React.createElement(Home);
};


var showLink = function(item, i) {
  var name = item[0];
  var url = item[1];
  var t = url ? $.a({ href: url }, name) : name;
  return $.li({ key: i }, t);
};


var Application = React.createClass({
  displayName: 'Application',

  render: function() {
    var adminKnown = localStorage.getItem('RCSR-testing-known') == 'true';

    var mirrors = [
      [ 'Locations:' ],
      [ 'rcsr.net (US)', 'http://rcsr.net' ],
      [ '-' ],
      [ 'Canberra', 'http://rcsr.anu.edu.au' ],
      [ '-' ],
      [ 'Stockholm'   , 'http://rcsr.fos.su.se' ]
    ];

    var links = [
      [ 'HOME', '/' ],
      [ 'ABOUT', '/about' ],
      [ 'LINKS', '/links' ],
      [ 'SYSTRE', '/systre' ],
      [ '3D NETS', '/nets' ],
      [ '2D NETS', '/layers' ],
      [ '1-PERIODIC', '/ribbons' ],
      [ 'POLYHEDRA', '/polyhedra' ]
    ];

    if (adminKnown) {
      links.push([ 'TESTING', '/testing' ]);
    }

    return $.div({ key: this.props.path },
                 $.div({ className: 'header' },
                       $.div({ className: 'logoText' }, 'RCSR'),
                       $.ul({ className: 'mirrors' }, mirrors.map(showLink)),
                       $.ul({ className: 'pageLinks' }, links.map(showLink))),
                 resolveRoute(this.props.path));
  }
});


module.exports = Application;
