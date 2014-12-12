'use strict';

var passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },

        function(email, password, done) {
            User.findOne({
                email: email
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user || !user.validPassword(password)) {
                    return done(null, false, {
                        message: "Invalid credentials!"
                    });
                }
                return done(null, user);
            });
        }
    ));

    passport.use(new FacebookStrategy({
            clientID: '467737049992745',
            clientSecret: 'e5b458f51fe93d361ef6df9f507cf0ce',
            callbackURL: 'http://localhost:3000/auth/facebook/callback',
            enableProof: false
        },
        function(accessToken, refreshToken, profile, done) {
            console.log(profile);
            User.findOne({
                'facebook.id': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (user) {
                    done(null, user);
                } else {
                    var user = new User({
                        'firstname': profile.name.givenName,
                        'lastname': profile.name.familyName,
                        'gender': profile.gender,
                        'email': profile.emails[0].value,
                        'meta.facebookId': profile.id,
                        'facebook': profile._json
                    });
                    user.save();
                }
            });
        }
    ));



    passport.use(new TwitterStrategy({
            consumerKey: 'EeEf8o2vztbwYYGACgQKzFO5v ',
            consumerSecret: 'yIxO1N1f4TAnGjvhTDmLwYIDwdwHvmoVlI38ortCko4rm1MoZE',
            callbackURL: 'http://localhost:5000/auth/twitter/callback'
        },
        function(token, tokenSecret, profile, done) {
            User.findOne({
                'twitter.id': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (user) {
                    done(null, user);
                } else {
                    var user = new User({
                        'twitter.id': profile.id,
                        'twitter.displayName': profile.displayName,
                        'twitter.username': profile.username,
                        'twitter': profile._json
                    });
                    user.save();
                }
            });

        }
    ));
};
