'use strict';

/** @module config/passport */

var config = require('./');

var UserModel = require('./../models/user');

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
          message: "Unable to login!"
        });
      }
      if (!user || !user.validPassword(password)) {
        return done(null, false, {
          message: "Invalid credentials!"
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
        message: "Missing information!",
        fields: {
          email: !req.body.email ? "Missing" : " ",
          firstname: !req.body.firstname ? "Missing" : " ",
          lastname: !req.body.lastname ? "Missing" : " ",
          // password: !req.body.password ? "Missing" : " ",
          // passwordConfirmation: !req.body.passwordConfirmation ? "Missing" : " ",
        }
      });

    if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(req.body.email))
      return done(null, false, {
        message: "Invalid email address!",
        fields: {
          email: "Invalid"
        }
      });

    if (req.body.password !== req.body.passwordConfirmation)
      return done(null, false, {
        message: "Password mismatch!",
        fields: {
          password: "Mismatch",
          passwordConfirmation: "Mismatch",
        }
      });

    if (!req.user) {
      UserModel.findOne({
        email: email
      }, function (err, user) {
        if (err) {
          // return done(err);
          return done(null, false, {
            message: "Unable to sign-up!"
          });
        }

        if (user) {
          return done(null, false, {
            message: "There is an existing account created using the provided email address! Please try password reset."
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
                message: "can't send email."
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
                  message: "can't send email."
                });
              }

              transporter.sendMail({
                from: config.notification.from,
                to: user.email,
                subject: 'Confirm Account Validation',
                html: html,
                // generateTextFromHTML: true,
                text: text
              }, function (err, responseStatus) {
                if (err) {
                  console.log(err);
                  return done(null, false, {
                    message: "this is an error!"
                  });
                }
                console.log(responseStatus.message);
                return done(null, false, {
                  message: 'An e-mail has been sent to ' + user.email + ' with further instructions.'
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
            message: "enable to connect local account"
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
      if (!req.user) {
        UserModel.findOne({
          'facebook.id': profile.id
        }, function (err, user) {

          if (err) {
            return done(err);
          }

          if (user) {
            done(null, user);
          }

          user = new UserModel({
            'email': profile.email ? profile.emails[0].value : null,
            'firstname': profile.name.givenName,
            'lastname': profile.name.familyName,
            'gender': profile.gender,
            'facebook.id': profile.id,
            'meta.facebookSignup': true,
            'meta.facebookId': profile.id,
            'picture': 'https://graph.facebook.com/' + profile.username + '/picture',
            'isValid': true
          });

          user.save(done);

        });
      } else {
        UserModel.findOne({
          'facebook.id': profile.id
        }, function (err, user) {

          if (err) {
            return done(err);
          }

          if (user) {
            return done(null, false, {
              message: "cannot connect Tunpixel Boilerplate Account. this Facebook Account is already used!"
            });
          }
          var user = req.user;
          user.facebook.id = profile.id;
          user.meta.facebookSignup = true;
          user.meta.facebookId = profile.id;

          user.save(function (err) {
            if (err) {
              console.log(err);
              return done(null, false, {
                message: "oops, this is embarrassing! enable to connect Facebook Account!"
              });
            }

            return done(null, user);
          });

        });
      }
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
      if (!req.user) {
        UserModel.findOne({
          'twitter.id': profile.id
        }, function (err, user) {

          if (err) {
            return done(err);
          }

          if (user) {
            console.log("user exist!");
            done(null, user);
          }

          user = new UserModel({
            'twitter.id': profile.id,
            'firstname': profile.username,
            'isValid': true
          });

          user.save(done);

        });
      } else {
        UserModel.findOne({
          'twitter.id': profile.id
        }, function (err, user) {

          if (err) {
            return done(err);
          }

          if (user) {
            console.log("user exist!");
            done(null, user);
          }

          var user = req.user;
          user.twitter.id = profile.id;
          user.save(done);
        });

      }
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
      if (!req.user) {
        UserModel.findOne({
          'google.id': profile.id
        }, function (err, user) {
          if (err) {
            console.log(err);
            return done(err);
          }

          if (user) {
            console.log("user exist!");
            done(null, user);
          }

          console.log("creating user...");

          user = new UserModel({
            'google.id': profile.id,
            'firstname': profile.name.givenName,
            'lastname': profile.name.familyName,
            'gender': profile._json.gender,
            'picture': profile._json.picture,
            'isValid': true
          });

          user.save(done);
        });
      } else {
        UserModel.findOne({
          'google.id': profile.id
        }, function (err, user) {
          if (err) {
            console.log(err);
            return done(err);
          }

          if (user) {
            return done(null, false, {
              message: "cannot connect Tunpixel Boilerplate Account. this Google Account is already used!"
            });
          }
          var user = req.user;
          user.google.id = profile.id;

          user.save(function (err) {
            if (err) {
              console.log(err);
              return done(null, false, {
                message: "oops, this is embarrassing! enable to connect Google Account!"
              });
            }

            return done(null, user);
          });
        });
      }
    }));


};
