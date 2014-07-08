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


common.makeBoundsProperties = function(names) {
  var result = {};
  names.forEach(function(name) {
    result[name] = {
      title: name,
      type: 'string',
      pattern: /^(([<>]?=?\d+(\.\d+)?)|(\d+(\.\d+)?-\d+(\.\d+)?))$/
    };
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
      exclude_b_c: obj['exclude binary (-b) and catenated pair (-c)']
    };
  },
  coordination: function(obj) {
    return obj.spec.split(/,/).map(function(s) {
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


common.SearchForm = React.createClass({
  displayName: 'SearchForm',

  render: function() {
    return Form({
      buttons: ['Search', 'Clear'],
      extraButtons: true,
      onSubmit: this.props.onSubmit,
      enterKeySubmits: 'Search',
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


common.Link = React.createClass({
  displayName: 'Link',

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
                 href: this.props.href },
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
  render: function() {
    var base = 'http://rcsr.net/public/images/';
    var symbol = this.props.symbol;
    var src = base + (this.state.full
                      ? this.props.prefix + 'Pics/' + symbol + '.jpg'
                      : this.props.prefix + 'PicsThumbs/' + symbol + 'T.jpg');

    if (this.props.mayEnlarge)
      return common.Link({ onClick: this.toggle },
                         $.img({ src: src, alt: '' }));
    else
      return $.img({ src: src, alt: '', onClick: this.toggle });
  }
});
