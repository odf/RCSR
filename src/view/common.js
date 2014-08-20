'use strict';

var React    = require('react');

var validate = require('plexus-validate');
var Form     = require('plexus-form');

var $ = React.DOM;

var laquo = '\u00ab';
var raquo = '\u00bb';


var common = module.exports;


common.makeBooleanProperties = function(names) {
  var result = {};
  names.forEach(function(name) {
    result[name] = { title: name, type: 'boolean' };
  });
  return result;
};


common.makeBoundsProperties = function(specs) {
  var result = {};
  specs.forEach(function(spec) {
    var name, url;

    if (typeof spec == 'string')
      name = spec;
    else {
      name = spec[0];
      url  = spec[1] || '/help/' + name.replace(/\s+/g, '_') + '.html';
    }

    result[name] = {
      title: name,
      type: 'string',
      pattern: /^((([<>]=?[ ]*)?\d+(\.\d+)?)|(\d+(\.\d+)?[ ]*-[ ]*\d+(\.\d+)?))$/
    };

    if (url) {
      result[name]['x-hints'] = {
        form: {
          helpURL: url
        }
      };
    }
  });
  return result;
};


var conversions = {
  symbol: function(obj) {
    return obj.text && obj.text.length > 0 && obj;
  },
  names: function(obj) {
    return obj.text && obj.text.length > 0 && obj;
  },
  keywords: function(obj) {
    var result = [];
    for (var key in obj)
      if (obj[key])
        result.push(key);
    return result;
  },
  modifiers: function(obj) {
    return {
      include_a  : obj['include augmented (-a)'],
      exclude_a  : obj['exclude augmented (-a)'],
      exclude_b_c: obj['exclude binary (-b...) and catenated (-c...)']
    };
  },
  coordination: function(obj) {
    return obj.spec.split(/[,; ][ ]*/).map(function(s) {
      return parseInt(s);
    });
  },
  bounds: function(data) {
    var result = {};
    var key, text, tmp;
    for (var key in data) {
      text = data[key];
      if (text.length > 0) {
        if (text.match(/-/)) {
          tmp = text.split('-');
          result[key] = {
            from: parseFloat(tmp[0]),
            to  : parseFloat(tmp[1])
          };
        } else if (text.match(/^<=/))
          result[key] = {
            to: parseFloat(text.slice(2))
          };
        else if (text.match(/^</))
          result[key] = {
            to: parseFloat(text.slice(1)),
            exclusive: true
          };
        else if (text.match(/^>=/))
          result[key] = {
            from: parseFloat(text.slice(2))
          };
        else if (text.match(/^>/))
          result[key] = {
            from: parseFloat(text.slice(1)),
            exclusive: true
          };
        else {
          tmp = parseFloat(text);
          result[key] = { from: tmp, to: tmp };
        }
      }
    }
    return result;
  }
};


common.makeQuery = function(inputs) {
  var tmp;
  var result = {};
  for (var key in inputs) {
    if (conversions.hasOwnProperty(key))
      tmp = conversions[key](inputs[key]);
    else
      tmp = inputs[key];

    if (tmp != null)
      result[key] = tmp;
  }
  return result;
};


function helpLink(path, schema) {
  var sch = schema;
  var url;

  path.forEach(function(key) {
    sch = sch.properties[key];
  });
  url = ((sch['x-hints'] || {}).form || {}).helpURL;

  return $.a({
    className: 'help-link' + (url ? '' : ' invisible'),
    href     : url,
    target   : '_blank'
  }, '?');
};


var makeFieldWrapper = function(schema) {
  return React.createClass({
    render: function() {
      var classes = (this.props.classes || []).concat(
        'form-element',
        this.props.errors ? 'error' : []).join(' ');

      return $.div({ className: classes, key: this.props.key },
                   $.label({ htmlFor: this.props.key },
                           this.props.title),
                   helpLink(this.props.path, schema),
                   this.props.children);
    }
  });
};


var makeSectionWrapper = function(schema) {
  return React.createClass({
    render: function() {
      var classes = (this.props.classes || []).concat(
        'form-section',
        this.props.path.length > 0 ? 'form-subsection' : []).join(' ');

      return $.fieldset({ className: classes, key: this.props.key },
                        $.legend({ className: 'form-section-title' },
                                 this.props.title,
                                 helpLink(this.props.path, schema)),
                        this.props.children);
    }
  });
};


common.SearchForm = React.createClass({
  displayName: 'SearchForm',

  render: function() {
    return Form({
      buttons: ['Search', 'Clear'],
      extraButtons: true,
      onSubmit: this.props.onSubmit,
      enterKeySubmits: 'Search',
      fieldWrapper: makeFieldWrapper(this.props.schema),
      sectionWrapper: makeSectionWrapper(this.props.schema),
      schema: this.props.schema,
      validate: validate,
      values: this.props.values
    });
  }
});


common.makeLine = function(title, values) {
  return $.span(null,
                $.span({ className: 'bold' }, title + ': '),
                $.span(null, values.join(', ')))
};


common.makeTable = function(headers, values) {
  return $.table(null,
                 $.thead(null,
                         $.tr(null, headers.map(function(s, i) {
                           return $.th({ key: i }, s);
                         }))),
                 $.tbody(null,
                         values.map(function(row, i) {
                           return $.tr({ key: i }, row.map(function(s, i) {
                             return $.td({ key: i }, s);
                           }));
                         })));
};


common.formatReferences = function(net, kinds, keywords) {
  var refs = [];
  var i, key, title, val;

  for (i in kinds) {
    key = kinds[i];
    title = key;
    val = net[key];

    if (key == 'keywords') {
      title = 'key words';
      val = val.filter(function(x) { return keywords.indexOf(x) >= 0; });
    }

    if (val.length > 0)
      refs.push($.li({ key: key }, common.makeLine(title, val)));
  }

  return refs;
};


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


common.StructureImage = React.createClass({
  displayName: 'StructureImage',

  getInitialState: function() {
    return { full: false };
  },
  toggle: function() {
    if (this.props.mayEnlarge)
      this.setState({ full: !this.state.full });
  },
  handleError: function(event) {
    this.setState({ error: true });
    event.preventDefault();
  },
  componentWillReceiveProps: function() {
    this.setState({ error: false });
  },
  render: function() {
    var base = '/images/';
    var symbol = this.props.symbol;
    var src = base + (this.state.full
                      ? this.props.prefix + 'Pics/' + symbol + '.jpg'
                      : this.props.prefix + 'PicsThumbs/' + symbol + 'T.jpg');

    var img = $.img({ src: src, alt: '', onError: this.handleError });

    if (this.state.error)
      return $.span({ className: 'thumbnail' }, '(no image)');
    if (this.props.mayEnlarge)
      return ActiveLink({ onClick: this.toggle }, img);
    else
      return $.span({ className: 'thumbnail' }, img);
  }
});


var maxDetails = 12;


common.Results = React.createClass({
  displayName: 'Results',

  getInitialState: function() {
    return {
      selected: -1,
      detailsOffset: 0,
      symbolsOnly: false
    }
  },
  componentWillReceiveProps: function(props) {
    var n = (props.results || []).length == 1 ? 0 : -1;
    this.setState({
      selected: n,
      detailsOffset: 0
    });
  },
  select: function(choice) {
    var mods;

    if (choice == 'forward')
      mods = { detailsOffset: this.state.detailsOffset + maxDetails };
    else if (choice == 'backward')
      mods = { detailsOffset: this.state.detailsOffset - maxDetails };
    else if (choice == 'details')
      mods = { selected: -1, symbolsOnly: false };
    else if (choice == 'symbols')
      mods = { selected: -1, symbolsOnly: true };
    else
      mods = { selected: choice };

    this.setState(mods);
  },
  render: function() {
    var type = this.props.type;
    var typePlural = this.props.typePlural || type + 's';
    var results = this.props.results || [];
    var n = results.length;
    var i = this.state.selected;
    var begin = this.state.detailsOffset;
    var end = Math.min(n, begin + maxDetails);
    var msg = 'Found ' + n + ' ' + typePlural + ' matching your search';
    var structure;

    var item = function(content) {
      return $.li({ className: 'fragment column' }, content);
    };

    var link = function(i, text) {
      return ActiveLink({ href: i, onClick: this.select }, text);
    }.bind(this);

    if (n < 1) {
      return $.p(null, msg + '.');
    } else if (i >= 0) {
      structure = results[i];
      msg = 'Showing ' + type + ' ' + (i+1) +
        ' of ' + n + ' matching your search.';

      return $.div(null,
                   $.ul({ className: 'plainList', key: 'no_' + i },
                        item(n > 1
                             ? link(-1, 'All Results') : 'All Results'),
                        item(i > 0
                             ? link(i-1, laquo + ' Previous') : 'Previous'),
                        item(i < n-1
                             ? link(i+1, 'Next ' + raquo) : 'Next')),
                   $.p(null, msg),
                   this.props.display({ data: structure }));
    } else if (this.state.symbolsOnly) {
      var resultList = results.map(function(structure, i) {
        return $.li({ className: 'fragment',
                      style: { width: '5em' },
                      key: structure.symbol },
                    link(i, structure.symbol));
      }.bind(this));

      return $.div(null,
                   $.ul({ className: 'plainList', key: 'all' },
                        link('details', 'More Details')),
                   $.p(null, msg + '.'),
                   $.div(null,
                         $.ul({ className: 'plainList' }, resultList)));
    } else {
      if (begin > 0 || end < n)
        msg = msg + ', showing ' + (begin+1) + ' through ' + end;
      msg = msg + '.'

      return $.div(null,
                   $.ul({ className: 'plainList', key: 'from_' + begin },
                        item(link('symbols', 'Symbols Only')),
                        item(begin > 0
                             ? link("backward", laquo + ' Previous') 
                             : 'Previous'),
                        item(end < n
                             ? link("forward", 'Next ' + raquo)
                             : 'Next')),
                   $.p(null, msg),
                   this.props.table(results.slice(begin, end),
                                    function(i) {
                                      var n = i + begin;
                                      return link(n, results[n].symbol);
                                    }));
    }
  }
});
