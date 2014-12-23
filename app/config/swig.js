'use strict';

module.exports = function (swig, app) {

  function number(input) {
    return new Number(input).toLocaleString('fr-FR');
  }
  swig.setFilter('number', number);

  function stripUrlScheme(url) {
    if (!url)
      return "";
    else if (url.indexOf('://') > -1)
      return url.substr(url.indexOf('://') + 3);
    else
      return url;
  }
  swig.setFilter('stripUrlScheme', stripUrlScheme);

  var moment = require('moment');

  moment.locale('fr_FR');

  function fromNow(dateString) {
    var datetime = moment(dateString);
    return datetime.isBefore(moment().subtract('days', 1)) ? datetime.calendar() : datetime.fromNow();
  }
  swig.setFilter('fromNow', fromNow);

  var path = require('path');
  var fs = require('fs');

  var root = path.resolve(__dirname + './../../../public');

  console.log(__dirname, root);

  swig.setExtension('load', function (pathname) {
    var template = '<script type="text/ng-template" id="' + pathname + '">';
    template += fs.readFileSync(root + pathname);
    template += '</script>';
    return template;
  });

  swig.setTag('loadTemplate', function (str, line, parser, types, options) {
    var matched = false;
    parser.on('*', function (token) {
      if (matched) {
        throw new Error('Unexpected token ' + token.match + '.');
      }
      matched = true;
      return true;
    });
    return true;
  }, function (compiler, args, content, parents, options, blockName) {
    return '_output += _ext.load(' + args[0] + ');';
  }, false, false);

};
