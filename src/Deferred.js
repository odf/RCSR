'use strict';

var React = require('react');
var createReactClass = require('create-react-class');

var $ = React.createElement;


var Deferred = createReactClass({
  displayName: 'Deferred',

  getInitialState: function() {
    return {
      unmounted: false,
      showMessage: false,
      data: null
    }
  },

  componentDidMount: function() {
    this.props.loader(this.handleLoaderEvent);
  },

  componentWillUnmount: function() {
    this.setState({ unmounted: true });
  },

  componentDidUpdate: function(prevProps) {
    if (this.props.loader != prevProps.loader)
      this.props.loader(this.handleLoaderEvent);
  },

  handleLoaderEvent: function(err, res) {
    if (err)
      alert(ex+'\n'+ex.stack);
    else if (!this.state.unmounted) {
      if (res == null)
        this.setState({ showMessage: true });
      else
        this.setState({ data: res, showMessage: false });
    }
  },

  render: function() {
    if (this.state.data)
      return React.createElement(this.props.component, {
        data: this.state.data,
        info: this.props.info });
    else if (this.state.showMessage)
      return $('div', null, $('p', null, 'Loading data...'));
    else
      return $('div');
  }
});


module.exports = Deferred;
