'use strict';

var React       = require('react');
var createReactClass = require('create-react-class');

var levelup     = require('levelup');
var leveljs     = require('level-js');
var encode      = require('encoding-down');
var csp         = require('plexus-csp');

var parseNets   = require('../parse/nets');
var parseLayers = require('../parse/layers');
var parseRibbons= require('../parse/ribbons');
var parsePolys  = require('../parse/polys');

var checkNets   = require('../check/nets');
var checkLayers = require('../check/layers');
var checkRibbons= require('../check/ribbons');
var checkPolys  = require('../check/polys');

var Nets        = require('../view/nets');
var Layers      = require('../view/layers');
var Ribbons     = require('../view/ribbons');
var Polyhedra   = require('../view/polys');

var sha1        = require('../sha1');
var widgets     = require('../widgets');

var credentials = require('./credentials');
var github      = require('./github');

var $ = React.createElement;


var parsers = {
  'Nets'     : parseNets,
  'Layers'   : parseLayers,
  'Ribbons'  : parseRibbons,
  'Polyhedra': parsePolys
};


var checkers = {
  'Nets'     : checkNets,
  'Layers'   : checkLayers,
  'Ribbons'  : checkRibbons,
  'Polyhedra': checkPolys
};


var components = {
  'Nets'     : Nets.search,
  'Layers'   : Layers.search,
  'Ribbons'  : Ribbons.search,
  'Polyhedra': Polyhedra.search
};


var merge = function() {
  var args = Array.prototype.slice.call(arguments);
  var result = args.every(Array.isArray) ? [] : {};
  var i, obj, key;
  for (i in args) {
    obj = args[i];
    for (key in obj)
      result[key] = obj[key];
  }
  return result;
};


var resizeImage = function(src, width, height, cb) {
  var img = new Image();

  img.onload = function() {
    var wd = img.width;
    var ht = img.height;

    var x0 = (width - wd) / 2;
    var y0 = (height - ht) / 2;

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, x0, y0, wd, ht);

    cb(null, canvas.toDataURL("image/jpeg"));
  };

  img.src = src;
};


var rescaleImage = function(src, width, height, cb) {
  var img = new Image();

  img.onload = function() {
    var desiredScale = Math.min(width / img.width, height / img.height);
    var scale = Math.max(desiredScale, 0.5);
    var wd = img.width * scale;
    var ht = img.height * scale;

    var canvas = document.createElement('canvas');
    canvas.width = wd;
    canvas.height = ht;
    canvas.getContext('2d').drawImage(img, 0, 0, wd, ht);

    var result = canvas.toDataURL("image/jpeg");
    if (scale > desiredScale)
      rescaleImage(result, width, height, cb);
    else if (wd != width || ht != height)
      resizeImage(result, width, height, cb);
    else
      cb(null, result);
  };

  img.src = src;
};


var sendToGithub = function(path, text, onProgress) {
  var gh = github({
    baseURL  : 'https://api.github.com/repos/rcsr-net/RCSR-content/contents/',
    token    : credentials().token,
    userAgent: 'RCSR',
    origin   : 'http://rcsr.net'
  });

  return gh.put(path, text, 'web commit', onProgress);
};


var simulateSend = function(path, text, onProgress) {
  return csp.go(function*() {
    var total = text.length;
    var loaded = 0;

    console.log('simulating file upload - sha1 = '+sha1(text));

    while (loaded < total) {
      yield csp.sleep(100);
      loaded = Math.min(loaded + 15000, total);
      onProgress({ loaded: loaded, total: total });
    }

    yield csp.sleep(500);
  });
};


var sendFile = function(path, text, onProgress) {
  if (credentials().simulate)
    return simulateSend(path, text, onProgress);
  else
    return sendToGithub(path, text, onProgress);
};


var structureTypeForSymbol = function(symbol, structures) {
  for (var type in structures)
    for (var i = 0; i < structures[type].length; ++i)
      if (structures[type][i].symbol == symbol)
        return type;
  return 'unknown';
};


var ProgressBar = createReactClass({
  displayName: 'ProgressBar',

  render: function() {
    var percent = this.props.progress * 100;
    return $('span', null,
                  $('span', { className: 'meter hSep-1em',
                           style: { width: '200px' } },
                         $('span', { style: { width: percent+'%' } })),
                  Math.round(percent)+'%');
  }
});


var Publish = createReactClass({
  displayName: 'Publish',

  getInitialState: function() {
    return {
    }
  },

  handleProgress: function(path, event) {
    var newState = {};
    newState[path] = {
      status  : 'sending...',
      progress: event.loaded / event.total
    };
    this.setState(newState);
  },

  handleCompletion: function(path, err, res, onCompletion) {
    var newState = {};
    newState[path] = {
      status  : err ? 'error: '+err : 'published successfully!',
      complete: !err,
      progress: null
    };
    this.setState(newState);

    csp.go(function*() {
      if (!err)
        yield onCompletion(path);
    }).then(null, function(ex) { console.log(ex + '\n' + ex.stack); });
  },

  publishSingle: function(data) {
    var handleProgress = this.handleProgress;
    var handleCompletion = this.handleCompletion;

    return csp.go(function*() {
      var err, res;

      try {
        res = yield sendFile(
          data.path,
          data.text,
          function(event) {
            handleProgress(data.path, event);
          });
      } catch (ex) {
        err = new Error(ex);
      }

      handleCompletion(data.path, err, res, data.onCompletion);
    });
  },

  publish: function() {
    var data = this.props.data;
    var publishSingle = this.publishSingle;

    csp.go(function*() {
      var i;
      for (i = 0; i < data.length; ++i)
        yield publishSingle(data[i]);
    }).then(null, function(ex) { console.log(ex + '\n' + ex.stack); });
  },

  renderPublishButton: function() {
    var creds = credentials();
    var n     = this.props.data.length;
    var label = 'Publish '+n+' files';
    var error, button;

    if (n == 0)
      error = 'You have no unpublished data.';
    else if (!creds.okay)
      error = 'You cannot publish without a valid access token.';

    if (error)
      button = $('p', { className: 'error' }, error);
    else
      button = $('input', { type   : 'submit',
                         key    : label,
                         value  : label,
                         onClick: this.publish });

    return $('div', null, $('h3', null, 'Publish'), button);
  },

  renderProgress: function(progress) {
    if (progress != null)
      return React.createElement(ProgressBar, { progress: progress });
  },

  renderPublishStatus: function() {
    var data = this.props.data
      .map(function(item) {
        var name      = item.path;
        var fileState = this.state[name] || {};
        var ok        = !status.match(/^Error:/)

        return $('tr', { key      : name,
                      className: ok ? '' : 'error' },
                    $('td', { className: 'leftAlign' }, name),
                    $('td', { className: 'leftAlign' },
                         fileState.status || 'not yet published',
                         this.renderProgress(fileState.progress)));
      }.bind(this));

    if (data.length > 0) {
      return $('div', null,
                   $('h3', null, 'Status'),
                   $('table', null,
                           $('thead', null,
                                   $('tr', null,
                                        $('th', null, 'Path'),
                                        $('th', null, 'Status'))),
                           $('tbody', null, data)));
    }
  },

  render: function() {
    var creds = credentials();

    return $('div', null,
                 $('h3', null, 'Credentials'),
                 $('p', null, $('b', null, 'Your name: '), (creds.user || '-')),
                 $('p', null, 'Access token '
                     +(creds.okay ? '' : 'not')+' found'),
                 this.renderPublishButton(),
                 this.renderPublishStatus());
  }
});


var Testing = createReactClass({
  displayName: 'Testing',

  getInitialState: function() {
    return {
      active: 'Nets',
      Nets: {
      },
      Layers: {
      },
      Ribbons: {
      },
      Polyhedra: {
      },
      Images: {
      },
      log: [
      ]
    }
  },

  componentDidMount: function() {
    this._db = levelup(encode(leveljs('RCSR'), { valueEncoding: 'json' }));

    this._db.get('publishing-log', function(err, val) {
      if (err) {
        console.error(err);
      } else
        this.setState({ log: val });
    }.bind(this));

    this._db.get('unpublished-images', function(err, val) {
      if (err) {
        console.error(err);
      } else
        this.setState({ Images: val });
    }.bind(this));
  },

  info: function(kind) {
    if (this.state[kind].data) {
      var props = this.state[kind];
      var n = props.data.length;
      return n+' '+(kind.toLowerCase()) +' from '+props.filename+'.';
    } else
      return 'No active data.';
  },

  addToLog: function(message) {
    var maxLength = 25;
    var simulated = credentials().simulate ? ' [simulated]' : '';
    var fullmsg   = message + ' on ' + (new Date()) + simulated;
    var newLog    = this.state.log.concat(fullmsg);

    if (newLog.length > maxLength)
      newLog.splice(0, newLog.length - maxLength);

    this.setState({ log: newLog });
    this._db.put('publishing-log', newLog);
  },

  addImage: function(name, data) {
    var images = merge(this.state.Images);
    images[name] = data;
    this.setState({ Images: images });
    this._db.put('unpublished-images', images);
  },

  removeImage: function(name) {
    var images = merge(this.state.Images);
    delete images[name];
    this.setState({ Images: images });
    this._db.put('unpublished-images', images);
  },

  publishableData: function() {
    var shortened = {
      Nets     : 'Net',
      Layers   : 'Layer',
      Ribbons  : 'Ribbon',
      Polyhedra: 'Poly'
    };
    var filename = {
      Nets     : '3dall.txt',
      Layers   : '2dall.txt',
      Ribbons  : '1dall.txt',
      Polyhedra: '0dall.txt'
    };

    var imageBuffer = function(dataURL) {
      return new Buffer(dataURL.split(',')[1], 'base64');
    };
    var data = [];

    ['Nets', 'Layers', 'Ribbons', 'Polyhedra'].forEach(function(key) {
      var section = this.state[key];
      if (section.filename)
        data.push({
          path: 'public/data/'+filename[key],
          text: section.text,
          onCompletion: function() {
            this.addToLog('published data for '+key.toLowerCase());
            var newState = {};
            newState[key] = {};
            this.setState(newState);
          }.bind(this)
        });
    }.bind(this));

    Object.keys(this.state.Images).forEach(function(name) {
      var entry = this.state.Images[name];
      if (entry.type == null || entry.type == 'unknown')
        return;

      var dirName = 'public/images/'+shortened[entry.type]+'Pics';
      var imageSent = false;
      var thumbSent = false;

      var imageDone = function() {
        this.addToLog('published image for '+name);
        this.removeImage(name);
      }.bind(this);

      data.push({
        path: dirName+'/'+name[0]+'/'+name+'.jpg',
        text: imageBuffer(entry.main),
        onCompletion: function() {
          imageSent = true;
          if (thumbSent)
            imageDone();
        }
      });
      data.push({
        path: dirName+'Thumbs/'+name[0]+'/'+name+'T.jpg',
        text: imageBuffer(entry.thumbnail),
        onCompletion: function() {
          thumbSent = true;
          if (imageSent)
            imageDone();
        }
      });
    }.bind(this));

    return data;
  },

  handleKindSelection: function(event) {
    this.setState({ active: event.target.value });
  },

  handleDataUpload: function(kind, text, filename) {
    var structures = parsers[kind](text);
    var type = kind.toLowerCase();
    var issues = [];
    var newState = {};
    var type, known;

    checkers[kind](structures, function(s) {
      issues.push(s);
    });

    known = {};
    for (var type in this.props.data) {
      if (kind != type) {
        (this.state[type].data || this.props.data[type]).forEach(function(s) {
          known[s.symbol] = type;
        });
      }
    }

    structures.forEach(function(s) {
      var type = known[s.symbol];
      if (type)
        issues.push(s.symbol+' - symbol already used in '+type.toLowerCase());
    });

    newState[kind] = {
      filename: filename,
      text    : text,
      data    : structures,
      issues  : issues.join('\n')
    };
    this.setState(newState);
  },

  handleImageUpload: function(data, filename) {
    var structures = merge(this.props.data);
    for (var type in structures)
      if (this.state[type].data)
        structures[type] = this.state[type].data;

    rescaleImage(data, 432, 432, function(err, main) {
      if (err) throw new Error(err);

      rescaleImage(main, 72, 72, function(err, thumbnail) {
        if (err) throw new Error(err);

        var name = filename.split('.')[0].toLowerCase();

        this.addImage(name, {
          type     : structureTypeForSymbol(name, structures),
          main     : main,
          thumbnail: thumbnail
        });
      }.bind(this));
    }.bind(this));
  },

  renderUploadSection: function(kind) {
    var handleUpload = this.handleDataUpload.bind(null, kind);
    var message = this.info(kind);

    var remove = function() {
      var newState = {};
      newState[kind] = {};
      this.setState(newState);
    }.bind(this);

    var removeIcon = this.state[kind].data &&
      $('img', { className: 'deleteIcon',
              onClick: remove,
              src: 'images/delete.gif'
            });
    return $('div', { key: kind },
             $('h2', null, kind),
             $('p', { className: 'withDeleteIcon' },
               $('input', { type: 'radio', name: 'type',
                            value: kind,
                            onChange: this.handleKindSelection,
                            defaultChecked: kind == 'Nets' }),
               $('span', null, message),
               removeIcon),
             $(widgets.Uploader, {
               key       : kind,
               prompt    : 'Load Data',
               binary    : false,
               handleData: handleUpload
             }));
  },

  renderLoadImages: function() {
    var images = this.state.Images;
    var removeImage = this.removeImage;

    var figure = function(name) {
      var remove = function() {
        removeImage(name);
      };

      return $('figure', { key: name, className: 'inlineFigure' },
               $('div', { className: 'withDeleteIcon' },
                 $('img', { src: images[name].thumbnail }),
                 $('img', { className: 'deleteIcon',
                            onClick: remove,
                            src: 'images/delete.gif'
                          }),
                 $('figcaption', { className: 'center' }, name)));
    };

    return $('div', { key: 'Images' },
             $('h2', null, 'Upload'),
             $(widgets.Uploader, {
               prompt    : 'Add Images',
               accept    : 'image/*',
               multiple  : true,
               binary    : true,
               handleData: this.handleImageUpload
             }),
                 ['Nets', 'Layers', 'Ribbons', 'Polyhedra', 'unknown']
                 .map(function(type) {
                   var content = Object.keys(images)
                     .filter(function(name) {
                       return (images[name].type || 'unknown') == type;
                     })
                     .map(figure);

                   if (content.length > 0)
                     return $('div', { key: type },
                                  $('h2', null, type),
                                  content);
                 }));
  },

  renderLoadData: function() {
    return $('div', null,
                 ['Nets', 'Layers', 'Ribbons', 'Polyhedra']
                 .map(this.renderUploadSection));
  },

  renderDiagnostics: function() {
    var section = this.state[this.state.active];

    return $('div', null, $('pre', null, section.issues || 'No problems found.'));
  },

  renderLog: function() {
    var log = this.state.log.slice();
    log.reverse();

    return $('div', null, $('pre', null, log.join('\n')));
  },

  renderPreview: function() {
    var section = this.state[this.state.active];

    if (section.data) {
      return React.createElement(components[this.state.active], {
        key : 'preview',
        data: section.data
      });
    } else
      return $('p', { key: 'nodata' }, 'Nothing yet to preview.');
  },

  render: function() {
    var comment = credentials().simulate ? ' [simulated]' : '';

    return $('div', null,
                 $('h1', null, 'Testing and Publishing' + comment),
                 $('p', null, this.info(this.state.active)),
                 React.createElement(
                   widgets.Tabs,
                   {
                     labels: ['Load Data',
                              'Diagnostics',
                              'Preview',
                              'Load Images',
                              'Publish',
                              'Log']
                   },
                   this.renderLoadData(),
                   this.renderDiagnostics(),
                   this.renderPreview(),
                   this.renderLoadImages(),
                   React.createElement(Publish,
                                       { data: this.publishableData() }),
                   this.renderLog()));
  }
});


module.exports = Testing;
