'use strict';

/** @module config/passport */

var config = require('./');
var MESSAGES = require('./messages');


var UserModel = require('./../models/user');

var async = require('async');

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(config.notification.configuration);

var crypto = require('crypto');

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var path = require('path'),
  templatesDir = path.resolve(__dirname, '..', './views/templates/'),
  emailTemplates = require('email-templates')

module.exports = function (passport) {

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    UserModel.findOne({
      _id: id
    }, '-password', function (err, user) {
      done(err, user);
    });
  });

  /**
   * login strategy
   */

  passport.use('login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function (req, email, password, done) {
    UserModel.findOne({
      email: email
    }, function (err, user) {
      if (err) {
        // return done(err);
        return done(null, false, {
          message: MESSAGES.LOGIN_FAILURE
        });
      }
      if (!user || !user.validPassword(password)) {
        return done(null, false, {
          message: MESSAGES.INVALID_CREDENTIALS
        });
      }
      return done(null, user);
    });
  }));

  /**
   * local strategy for sign-up
   */

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function (req, email, password, done) {

    if (!req.body.email || !req.body.firstname || !req.body.lastname || !req.body.password || !req.body.passwordConfirmation)
      return done(null, false, {
      message: MESSAGES.MISSING_INFORMATION,
        fields: {
          email: !req.body.email ? MESSAGES.MISSING_INPUT : " ",
          firstname: !req.body.firstname ? MESSAGES.MISSING_INPUT : " ",
          lastname: !req.body.lastname ? MESSAGES.MISSING_INPUT : " ",
          // password: !req.body.password ? MESSAGES.MISSING_INPUT : " ",
          // passwordConfirmation: !req.body.passwordConfirmation ? MESSAGES.MISSING_INPUT : " ",
        }
      });

    if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(req.body.email))
      return done(null, false, {
        message: MESSAGES.INVALID_EMAIL,
        fields: {
          email: MESSAGES.INVALID_INPUT
        }
      });

    if (req.body.password !== req.body.passwordConfirmation)
      return done(null, false, {
        message: MESSAGES.PASSWORD_MISMATCH,
        fields: {
          password: MESSAGES.UNMATCHED_INPUT,
          passwordConfirmation: MESSAGES.UNMATCHED_INPUT,
        }
      });

    if (!req.user) {
      UserModel.findOne({
        email: email
      }, function (err, user) {
        if (err) {
          // return done(err);
          return done(null, false, {
            message: MESSAGES.SIGNUP_FAILURE
          });
        }

        if (user) {
          return done(null, false, {
            message: MESSAGES.SIGNUP_FAILURE_EMAIL_USED
          });
        }

        user = new UserModel({
          'email': email,
          'firstname': req.body.firstname,
          'lastname': req.body.lastname,
          'local.signup': true
        });

        user.password = user.generateHash(password);

        //send an email
        //generate a token
        user.tokenValidation = function randomValue(len) {
          return crypto.randomBytes(Math.ceil(len * 3 / 4))
            .toString('base64')
            .slice(0, len)
            .replace(/\+/g, '0')
            .replace(/\//g, '0');
        }(16);

        user.save(function (err) {
          if (err) {
            console.log(err);
            return done(null, false, {
              message: "user saved but email not sent."
            });
          }

          emailTemplates(templatesDir, {
            open: '{{',
            close: '}}'
          }, function (err, template) {

            if (err) {
              console.log(err);

              return done(null, false, {
                message: MESSAGES.EMAIL_FAILURE
              });
            }

            var locals = {
              tokenValidation: user.tokenValidation,
              headersHost: req.headers.host
            };

            // Send a single email
            template('activate-account', locals, user, function (err, html, text) {
              if (err) {
                console.log(err);
                return done(null, false, {
                  message: MESSAGES.EMAIL_FAILURE
                });
              }

              transporter.sendMail({
                from: config.notification.from,
                to: user.email,
                subject: MESSAGES.ACCOUNT_VALIDATION_SUBJECT,
                html: html,
                // generateTextFromHTML: true,
                text: text
              }, function (err, responseStatus) {
                if (err) {
                  console.log(err);
                  return done(null, false, {
                    message: MESSAGES.EMAIL_FAILURE
                  });
                }
                console.log(responseStatus.message);
                return done(null, false, {
                  message: MESSAGES.EMAIL_SENT
                });
              });
            });
          });

          return done(null, user);
        });

      });
    } else {
      console.log(req.user);
      var user = req.user;
      user.email = email;
      user.password = user.generateHash(password);
      user.local.connected = true;

      user.save(function (err) {
        if (err) {
          console.log(err);
          return done(null, false, {
            message: MESSAGES.LINK_FAILURE
          });
        }

        return done(null, user);
      });
    }
  }));

  /**
   * Facebook strategy
   */

  passport.use(new FacebookStrategy({
      clientID: config.passport.facebook.clientID,
      clientSecret: config.passport.facebook.clientSecret,
      callbackURL: config.passport.facebook.callbackURL,
      // enableProof: false,
      passReqToCallback: true
    },
    function (req, token, refreshToken, profile, done) {
      console.log('FACEBOOK_STRATEGY');

      // async.auto({
      //   user: function getUser(callback) {
      //     console.log('in user');
      //     UserModel.findOne({
      //       'facebook.id': profile.id
      //     }, callback);
      //   },
      //   // authenticate: ['user', function authenticate(callback, results) {
      //   //   console.log('in authenticate', JSON.stringify(results));
      //   //   callback(null, results.user);
      //   // }]
      // }, function (err, results) {
      //   console.log('err = ', err);
      //   console.log('results = ', results);
      // });

      UserModel.findOne({
        'facebook.id': profile.id
      }, function (err, user) {

        if (err)
          return done(err);

        if (!req.user) { // user is NOT logged in, login or signup

          // login
          if (user)
            return done(null, user);

          // signup
          delete profile._raw;
          // delete profile._json;
          var picture = 'https://graph.facebook.com/' + profile.username + '/picture';
          user = new UserModel({
            'facebook.id': profile.id,
            'facebook.data': profile,
            'email': profile.emails ? profile.emails[0].value : null,
            'firstname': profile.name ? profile.name.givenName || '' : profile.displayName || '',
            'lastname': profile.name ? profile.name.familyName || '' : '',
            'gender': profile.gender || 'unknown',
            'picture': profile.photos ? profile.photos[0].value || picture : picture,
            // 'picture': 'https://graph.facebook.com/' + profile.username + '/picture',
            'meta.facebookSignup': true,
            'meta.facebookId': profile.id,
            'isValid': true
          });
          user.save(done);

        } else { // user logged in .. linking

          // link error
          if (user)
            return done(null, false, {
              message: MESSAGES.LINK_FAILURE_ACCOUNT_USED
            });

          // link
          delete profile._raw;
          // delete profile._json;
          var user = req.user;
          user.facebook.id = profile.id;
          user.facebook.data = profile;
          user.meta.facebookSignup = true;
          user.meta.facebookId = profile.id;
          user.save(function (err) {
            if (err)
              return done(null, false, {
                message: MESSAGES.LINK_FAILURE
              });
            return done(null, user);
          });

        }

      });

    }));

  /**
   * Twitter strategy
   */

  passport.use(new TwitterStrategy({
      consumerKey: config.passport.twitter.consumerKey,
      consumerSecret: config.passport.twitter.consumerSecret,
      callbackURL: config.passport.twitter.callbackURL,
      passReqToCallback: true
    },
    function (req, token, tokenSecret, profile, done) {

      UserModel.findOne({
        'twitter.id': profile.id
      }, function (err, user) {

        if (err)
          return done(err);

        if (!req.user) { // user is NOT logged in, login or signup

          // login
          if (user)
            return done(null, user);

          // signup
          delete profile._raw;
          // delete profile._json;
          user = new UserModel({
            'twitter.id': profile.id,
            'twitter.data': profile,
            'email': profile.emails ? profile.emails[0].value : null,
            'firstname': profile.name ? profile.name.givenName || '' : profile.displayName || '',
            'lastname': profile.name ? profile.name.familyName || '' : '',
            'gender': profile.gender || 'unknown',
            'picture': profile.photos ? profile.photos[0].value || null : null,
            'isValid': true
          });
          user.save(done);

        } else { // user logged in .. linking

          // link error
          if (user)
            return done(null, false, {
              message: MESSAGES.LINK_FAILURE_ACCOUNT_USED
            });

          // link
          delete profile._raw;
          // delete profile._json;
          var user = req.user;
          user.twitter.id = profile.id;
          user.twitter.data = profile;
          user.save(function (err) {
            if (err)
              return done(null, false, {
                message: MESSAGES.LINK_FAILURE
              });
            return done(null, user);
          });

        }

      });

    }));

  /**
   * Google strategy
   */

  passport.use(new GoogleStrategy({
      clientID: config.passport.google.clientID,
      clientSecret: config.passport.google.clientSecret,
      callbackURL: config.passport.google.callbackURL,
      passReqToCallback: true
    },
    function (req, token, tokenSecret, profile, done) {

      UserModel.findOne({
        'google.id': profile.id
      }, function (err, user) {

        if (err)
          return done(err);

        if (!req.user) { // user is NOT logged in, login or signup

          // login
          if (user)
            return done(null, user);

          // signup
          delete profile._raw;
          // delete profile._json;
          user = new UserModel({
            'google.id': profile.id,
            'google.data': profile,
            'email': profile.emails ? profile.emails[0].value : null,
            'firstname': profile.name ? profile.name.givenName || '' : profile.displayName || '',
            'lastname': profile.name ? profile.name.familyName || '' : '',
            'gender': profile.gender || 'unknown',
            'picture': profile.photos ? profile.photos[0].value || null : null,
            'isValid': true
          });
          user.save(done);

        } else { // user logged in .. linking

          // link error
          if (user)
            return done(null, false, {
              message: MESSAGES.LINK_FAILURE_ACCOUNT_USED
            });

          // link
          delete profile._raw;
          // delete profile._json;
          var user = req.user;
          user.google.id = profile.id;
          user.google.data = profile;
          user.save(function (err) {
            if (err)
              return done(null, false, {
                message: MESSAGES.LINK_FAILURE
              });
            return done(null, user);
          });

        }

      });

    }));

};
