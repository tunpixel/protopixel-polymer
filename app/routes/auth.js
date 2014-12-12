'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var async = require('async');
var passport = require('passport');

var UserModel = require('../models/user');

var auth = require('../config/auth');

var ROUTES = auth.ROUTES;

/* GET home page. */
router.get('/', auth.isAuthenticated, function(req, res, next) {
    res.render('index.html', {
        title: "Kool.tn"
    });
});

//-----------------------------------------------------------------------
//  LocalStrategyRoutes -------------------------------------------------
//-----------------------------------------------------------------------

router.get('/login', function(req, res) {
    if (req.isAuthenticated())
        return res.redirect(ROUTES.AUTH_HOME);
    res.render('login.html', {
        message: req.flash('error')
    });
});

router.post('/login', function(req, res, next) {
    if (!req.body.email || !req.body.password)
        return res.render('login.html', {
            email: req.body.email,
            message: ["Missing credentials!"],
            fields: {
                email: " ",
                password: " "
            }
        });
    if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(req.body.email))
        return res.render('login.html', {
            email: req.body.email,
            message: ["Login failure!"],
            fields: {
                email: "Invalid email address!"
            }
        });

    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login.html', {
                email: req.body.email,
                message: ["Invalid credentials!"],
                fields: {
                    email: " ",
                    password: " "
                }
            });
        }
        req.login(user, function(err) {
            if (err) {
                return next(err);
            }
            return res.redirect(ROUTES.AUTH_HOME);
        });
    })(req, res, next);
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect(ROUTES.AUTH_HOME);
});

router.get('/signup', function(req, res) {
    if (req.isAuthenticated())
        return res.redirect(ROUTES.AUTH_HOME);
    res.render('signup.html', {
        message: req.flash('error')
    });
});

router.post('/signup', function(req, res, next) {
    if (!req.body.email || !req.body.password)
        return res.render('signup.html', {
            email: req.body.email,
            message: ["Missing credentials!"],
            fields: {
                email: " ",
                password: " "
            }
        });
    if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(req.body.email))
        return res.render('signup.html', {
            email: req.body.email,
            message: ["Signup failure!"],
            fields: {
                email: "Invalid email address!"
            }
        });
    if (!/.{8,}/.test(req.body.password))
        return res.render('signup.html', {
            email: req.body.email,
            message: ["Signup failure!"],
            fields: {
                password: "Password too short!"
            }
        });

    var user = new UserModel({
        email: req.body.email,
        password: req.body.password
    });
    user.save(function() {
        console.log(arguments)
        req.login(user, function(err) {
            if (err)
                return next(err);
            return res.redirect(ROUTES.AUTH_HOME);
        });
    });
});

router.get('/link', function(req, res) {
    res.render('local.html', {
        message: req.flash('loginMessage')
    });
});

router.post('/link', function(req, res, next) {
    if (!req.body.email || !req.body.password)
        return res.render('signup.html', {
            email: req.body.email,
            message: ["Missing credentials!"],
            fields: {
                email: " ",
                password: " "
            }
        });
    if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(req.body.email))
        return res.render('signup.html', {
            email: req.body.email,
            message: ["Signup failure!"],
            fields: {
                email: "Invalid email address!"
            }
        });
    if (!/.{8,}/.test(req.body.password))
        return res.render('signup.html', {
            email: req.body.email,
            message: ["Signup failure!"],
            fields: {
                password: "Password too short!"
            }
        });

    var user = new UserModel({
        email: req.body.email,
        password: req.body.password
    });
    user.save(function() {
        console.log(arguments)
        req.login(user, function(err) {
            if (err)
                return next(err);
            return res.redirect(ROUTES.AUTH_HOME);
        });
    });
});

// router.get('/unlink', function(req, res) {
//     var user = req.user;
//     user.email = undefined;
//     user.password = undefined;

//     user.save(function(err) {
//         res.redirect(ROUTES.AUTH_HOME);
//     });
// });

//-----------------------------------------------------------------------
//  FacebookStrategyRoutes ----------------------------------------------
//-----------------------------------------------------------------------

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: ROUTES.AUTH_SIGNUP,
    successRedirect: ROUTES.AUTH_HOME
}), function(req, res) {
    console.log(arguments)
    res.redirect(ROUTES.AUTH_HOME);
});

//connect fb account
router.get('/link/facebook', passport.authorize('facebook'));

router.get('/link/facebook/callback', passport.authorize('facebook', {
    successRedirect: ROUTES.AUTH_HOME
}));

router.get('/unlink/facebook', function(req, res) {
    var user = req.user;
    user.facebook = undefined;
    user.save(function(err) {
        res.redirect(ROUTES.AUTH_HOME);
    });
});

//twitter auth.
router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/login'
}), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect(ROUTES.AUTH_HOME);
});


module.exports = router;
