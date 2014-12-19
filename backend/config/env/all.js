'use strict';

var path = require('path'),
  rootPath = path.normalize(__dirname + '/../..');

var port = process.env.PORT || 3000;

module.exports = {

  app: {
    title: 'Express Polymer Boilerplate',
    description: '...',
    keywords: '...'
  },

  passport: {
    facebook: {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: 'http://localhost:' + port + '/auth/facebook/callback',
    },
    twitter: {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: 'http://localhost:' + port + '/auth/twitter/callback'
    },
    google: {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: 'http://localhost:' + port + '/auth/google/callback'
    },
  },

  root: rootPath,
  port: process.env.PORT || 3000,

  sessionSecret: '!SECRET?',

  apiSecret: '!SECRET?'

};
