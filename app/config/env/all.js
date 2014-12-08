'use strict';

var path = require('path'),
  rootPath = path.normalize(__dirname + '/../..');

module.exports = {

  app: {
    title: 'Express Polymer Boilerplate',
    description: '...',
    keywords: '...'
  },

  root: rootPath,
  port: process.env.PORT || 5000,

  sessionSecret: '!SECRET?',

  apiSecret: '!SECRET?'

};
