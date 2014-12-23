'use strict';

var path = require('path'),
  rootPath = path.normalize(__dirname + '/../..');

var port = process.env.PORT || 3000;

module.exports = {

  app: {
    title: 'Express Polymer Boilerplate',
    description: '...',
    keywords: '...',
    url: process.env.URL
  },

  root: rootPath,

  port: port,

  db: process.env.MONGODB_URL,

  sessionSecret: process.env.SESSION_SECRET,
  sessionCollection: 'sessions',
  sessionCookie: {
    path: '/',
    httpOnly: true,
    // If secure is set to true then it will cause the cookie to be set
    // only when SSL-enabled (HTTPS) is used, and otherwise it won't
    // set a cookie. 'true' is recommended yet it requires the above
    // mentioned pre-requisite.
    secure: false,
    // Only set the maxAge to null if the cookie shouldn't be expired
    // at all. The cookie will expunge when the browser is closed.
    maxAge: null,
    // To set the cookie in a specific domain uncomment the following
    // setting:
    // domain: 'yourdomain.com'
  },
  sessionName: 'protopixel.sid',

  passport: {
    facebook: {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK
    },
    twitter: {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK
    },
    google: {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK
    },
  },

  notification: {
    configuration: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      maxConnections: 5,
      maxMessages: 10
    },
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO
  }

};
