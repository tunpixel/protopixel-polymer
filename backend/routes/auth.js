'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var async = require('async');
var passport = require('passport');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

var UserModel = require('../models/user');

var auth = require('../config/auth');

var ROUTES = auth.ROUTES;

var path = require('path'),
    templatesDir = path.resolve(__dirname, '..', './views/templates/'),
    emailTemplates = require('email-templates')

/* GET home page. */
router.get('/', auth.isAuthenticated, function (req, res, next) {
    res.render('index.html', {
        title: "Kool.tn"
    });
});


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
 * Local Link
 */

router.get('/link', function (req, res) {
    res.render('local.html', {
        message: req.flash('loginMessage')
    });
});

router.post('/link', passport.authenticate('local', {
    successRedirect: ROUTES.AUTH_HOME,
    failureRedirect: '/link',
    failureFlash: true
}));

router.get('/unlink', function (req, res) {
    var user = req.user;
    user.email = undefined;
    user.password = undefined;

    user.save(function (err) {
        res.redirect(ROUTES.AUTH_HOME);
    });
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
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/auth/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
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
                } else {
                    // Prepare nodemailer transport object
                    var transport = nodemailer.createTransport({
                        service: "Gmail",
                        auth: {
                            user: 'kool.app.tests@gmail.com',
                            pass: 'tunpixel pass'
                        }
                    });

                    console.log("transporter ready!");
                    console.log(req.headers.host);

                    var locals = {
                        token: token,
                        headersHost: req.headers.host
                    };

                    // Send a single email
                    template('forgot-password', locals, user, function (err, html, text) {
                        if (err) {
                            console.log(err);
                        } else {
                            transport.sendMail({
                                from: 'nihel@tunpixel.com', // sender address
                                to: user.email,
                                subject: 'Password Reset',
                                html: html,
                                // generateTextFromHTML: true,
                                text: text
                            }, function (err, responseStatus) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(responseStatus.message);

                                    return done(null, false, {
                                        message: 'An e-mail has been sent to ' + user.email + ' with further instructions.'
                                    });
                                }
                            });
                        }
                    });
                }
            });

        }
    ], function (err) {
        if (err) return console.log(err);
        res.redirect('/auth/forgot');
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
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/auth/forgot');
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
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    console.log('no user found!');
                    return res.redirect('back');
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
                } else {
                    console.log("here we go");
                    // Prepare nodemailer transport object
                    var transport = nodemailer.createTransport({
                        service: "Gmail",
                        auth: {
                            user: 'kool.app.tests@gmail.com',
                            pass: 'tunpixel pass'
                        }
                    });

                    console.log("transporter ready!");


                    // Send a single email
                    template('reset-password', user, function (err, html, text) {
                        if (err) {
                            console.log(err);
                        } else {
                            transport.sendMail({
                                from: 'nihel@tunpixel.com', // sender address
                                to: user.email,
                                subject: 'Your password has been changed',
                                html: html,
                                // generateTextFromHTML: true,
                                text: text
                            }, function (err, responseStatus) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(responseStatus.message);

                                    return done(null, false, {
                                        message: 'An e-mail has been sent to ' + user.email + ' with further instructions.'
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    ], function (err) {
        console.log(err);
        res.redirect('/auth');
    });
});


/**
 * account validation
 */
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
 * Facebook Auth
 */

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback', passport.authenticate('facebook', {
    successRedirect: ROUTES.AUTH_HOME,
    failureRedirect: ROUTES.AUTH_SIGNUP,
}), function (req, res) {
    console.log(arguments);
    res.redirect(ROUTES.AUTH_HOME);
});

//connect fb account
router.get('/link/facebook', passport.authorize('facebook'));

router.get('/link/facebook/callback', passport.authorize('facebook', {
    successRedirect: ROUTES.AUTH_HOME
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
    failureRedirect: ROUTES.AUTH_LOGIN,
}), function (req, res) {
    // Successful authentication, redirect home.
    res.redirect(ROUTES.AUTH_HOME);
});


/**
 * Google Auth
 */
router.get('/google',
    passport.authenticate('google', {
        scope: 'https://www.googleapis.com/auth/plus.login'
    }));

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: ROUTES.AUTH_SIGNUP,
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect(ROUTES.AUTH_HOME);
    });


module.exports = router;
