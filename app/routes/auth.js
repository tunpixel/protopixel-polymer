'use strict';

/** @module routes/auth */

var config = require('./../config');

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var async = require('async');
var passport = require('passport');
var crypto = require('crypto');

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(config.notification.configuration);

var UserModel = require('./../models/user');


var ROUTES = require('app/config/routes');

var auth = require('./../middlewares/auth');

var path = require('path'),
  templatesDir = path.resolve(__dirname, '..', './views/templates/'),
  emailTemplates = require('email-templates')


/**
 * Auth home page
 */

// router.get('/', auth.authenticatedAccessMiddleware, function (req, res, next) {
//   res.render('index.html', {
//     title: "Tunpixel Boilerplate",
//     message: req.flash('loginMessage')
//   });
// });


router.get('/', function (req, res, next) {
  return res.redirect('/');
})

/**
 * Local Signup
 */

router.get('/signup', function (req, res) {
  if (req.isAuthenticated())
    return res.redirect(ROUTES.AUTH_HOME);
  res.render('signup.html', {
    message: req.flash('error')
  });
});

router.post('/signup', function (req, res, next) {
  passport.authenticate('local', {
    badRequestMessage: "Missing information!"
  }, function (err, user, info, status) {
    console.log(arguments);
    if (err) {
      return next(err);
    }
    if (!user) {
      // return res.redirect(ROUTES.AUTH_SIGNUP);
      return res.render('signup.html', {
        message: [info.message],
        fields: info.fields,
        email: req.body.email,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        gender: req.body.gender,
      });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(ROUTES.AUTH_HOME);
    });
  })(req, res, next);
});

//link local account

router.get('/link', function (req, res) {
  res.render('local.html', req.user);
});

router.post('/link', function (req, res, next) {
  passport.authenticate('local', {
    badRequestMessage: "Missing information!"
  }, function (err, user, info, status) {
    console.log(arguments);
    if (err) {
      return next(err);
    }
    if (!user) {
      // return res.redirect(ROUTES.AUTH_SIGNUP);
      return res.render('local.html', {
        message: [info.message],
        fields: info.fields,
        email: req.body.email,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        gender: req.body.gender,
      });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(ROUTES.AUTH_HOME);
    });
  })(req, res, next);
});

router.get('/unlink', function (req, res) {
  var user = req.user;
  user.password = undefined;
  user.tokenValidation = undefined;
  user.email = undefined;

  user.local.connected = false;

  user.save(function (err) {
    res.redirect(ROUTES.AUTH_HOME);
  });
});

//account validation after local signup

router.get('/valid/:tokenValidation', function (req, res) {
  UserModel.findOne({
    tokenValidation: req.params.tokenValidation

  }, function (err, user) {

    res.render('valid.html', {
      user: req.user,
      tockenurl: req.params.tokenValidation
    });
  });
});

router.post('/valid/:tokenValidation', function (req, res) {
  async.waterfall([

    function (done) {
      UserModel.findOne({
        tokenValidation: req.params.tokenValidation
      }, function (err, user) {
        user.isValid = true;

        user.save(function (err) {
          if (err) {
            throw err
          }
          return done(null, user);
        });
      });
    }
  ], function (err) {
    console.log(err);
    res.redirect('/auth');
  });
});


/**
 * Local Login
 */

router.get('/login', function (req, res) {
  if (req.isAuthenticated())
    return res.redirect(ROUTES.AUTH_HOME);
  res.render('login.html', {
    message: req.flash('error')
  });
});

router.post('/login', function (req, res, next) {
  passport.authenticate('login', {
    badRequestMessage: "Missing information!"
  }, function (err, user, info, status) {
    console.log(arguments);
    if (err) {
      return next(err);
    }
    if (!user) {
      // return res.redirect(ROUTES.AUTH_LOGIN);
      return res.render('login.html', {
        message: [info.message],
        email: req.body.email
      });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(ROUTES.AUTH_HOME);
    });
  })(req, res, next);
});


router.get('/logout', function (req, res) {
  req.logout();
  res.redirect(ROUTES.AUTH_HOME);
});

/**
 * Password Reset
 */

//forget password
router.get('/forgot', function (req, res) {
  res.render('forgot', {
    user: req.user
  });
});

router.post('/forgot', function (req, res) {
  async.waterfall([

    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      UserModel.findOne({
        email: req.body.email
      }, function (err, user) {

        if (!user) {
          return res.render('forgotR.html');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          return done(err, token, user);
        });

      });
    },
    function (token, user, done) {

      emailTemplates(templatesDir, {
        open: '{{',
        close: '}}'
      }, function (err, template) {

        if (err) {
          console.log(err);
        }

        var locals = {
          token: token,
          headersHost: req.headers.host
        };
        // Send a single email
        template('forgot-password', locals, user, function (err, html, text) {

          if (err) {
            console.log(err);
            return done(null, false, {
              message: "can't send email."
            });
          }

          transporter.sendMail({
            from: config.notification.from, // sender address
            to: user.email,
            subject: 'Password Reset',
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

    }
  ], function (err) {
    if (err)
      return console.log(err);
    res.render('forgotR.html');

    // res.render('forgot.html', {
    //   messagev: 'An e-mail has been sent to your email address with further instructions.'
    // });
  });
});

router.get('/reset/:token', function (req, res) {
  UserModel.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function (err, user) {
    if (!user) {

      return res.render('forgot.html', {
        message: 'Password reset token is invalid or has expired.'
      });

      // req.flash('error', 'Password reset token is invalid or has expired.');
      // return res.redirect('/auth/forgot');
    }
    res.render('reset.html', {
      user: req.user,
      tockenurl: req.params.token
    });
  });
});

router.post('/reset/:token', function (req, res) {
  async.waterfall([

    function (done) {
      UserModel.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function (err, user) {

        if (!user) {
          return res.render('forgot.html', {
            message: 'Password reset token is invalid or has expired.',
          });

          // req.flash('error', 'Password reset token is invalid or has expired.');
          // return res.redirect('back');
        }

        if (req.body.password !== req.body.passwordConfirmation) {
          return res.render('reset.html', {
            user: req.user,
            tockenurl: req.params.token,
            message: "password doesn't match confirmation"

          });
        }

        user.password = user.generateHash(req.body.password);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function (err) {
          if (err) {
            throw err
          }

          return done(null, user);
        });
      });
    },
    function (user, done) {

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

        var userInfo = {
          email: user.email
        };

        // Send a single email
        template('reset-password', userInfo, function (err, html, text) {
          if (err) {
            console.log(err);
            return done(null, false, {
              message: "can't send email."
            });
          }

          transporter.sendMail({
            from: config.notification.from, // sender address
            to: user.email,
            subject: 'Your password has been changed',
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
              message: 'An e-mail has been sent to ' + user.email
            });

          });

        });
      });
    }
  ], function (err) {
    console.log(err);
    res.redirect('/auth');

    // return res.render('login.html', {
    //   messageS: "Your password has been changed."
    // });
  });
});


/**
 * Facebook Auth
 */

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback', function (req, res, next) {

  console.log('FACEBOOK_CALLBACK', req);
  next();
}, passport.authenticate('facebook', {
  successRedirect: ROUTES.AUTH_HOME,
  failureRedirect: ROUTES.AUTH_LOGIN,
}));

//connect fb account
router.get('/link/facebook', passport.authorize('facebook'));

router.get('/link/facebook/callback', passport.authorize('facebook', {
  successRedirect: ROUTES.AUTH_HOME,
}));


router.get('/unlink/facebook', function (req, res) {
  var user = req.user;
  user.facebook = undefined;
  user.meta.facebookSignup = false;
  user.save(function (err) {
    res.redirect(ROUTES.AUTH_HOME);
  });
});


/**
 * Twitter Auth
 */

router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/callback', passport.authenticate('twitter', {
  successRedirect: ROUTES.AUTH_HOME,
  failureRedirect: ROUTES.AUTH_LOGIN,
}));

//link twitter account
router.get('/link/twitter', passport.authorize('twitter'));

router.get('/link/twitter/callback', passport.authorize('twitter', {
  successRedirect: ROUTES.AUTH_HOME
}));

router.get('/unlink/twitter', function (req, res) {
  var user = req.user;
  user.twitter = undefined;
  user.save(function (err) {
    res.redirect(ROUTES.AUTH_HOME);
  });
});

/**
 * Google Auth
 */
router.get('/google', passport.authenticate('google', {
  scope: 'https://www.googleapis.com/auth/plus.login'
}));

router.get('/google/callback', passport.authenticate('google', {
  successRedirect: ROUTES.AUTH_HOME,
  failureRedirect: ROUTES.AUTH_LOGIN,
}));


//connect Google account

router.get('/link/google', passport.authorize('google', {
  scope: 'https://www.googleapis.com/auth/plus.login'
}));

router.get('/link/google/callback', passport.authorize('google', {
  successRedirect: ROUTES.AUTH_HOME
}));

router.get('/unlink/google', function (req, res) {
  var user = req.user;
  user.google = undefined;
  user.save(function (err) {
    res.redirect(ROUTES.AUTH_HOME);
  });
});

module.exports = router;
