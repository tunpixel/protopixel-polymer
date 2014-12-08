'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var async = require('async');

var UserModel = require('../models/user');


module.exports = function(app, passport) {

    function isAuthenticated(req, res, next) {
        console.log(req.user);
        res.locals.user = req.isAuthenticated() ? req.user : null;
        if (!req.isAuthenticated())
        return res.redirect(app.locals.AUTH_LOGIN);
        next();
    }

    /* GET home page. */
    router.get('/', isAuthenticated, function(req, res, next) {
        res.redirect('/');
    });

    router.get('/login', function(req, res) {
        if (req.isAuthenticated())
            return res.redirect(app.locals.AUTH_REDIRECT);
        res.render('login.html', {
            message: req.flash('error')
        });
    });

    // router.post('/login',
    //     passport.authenticate('local', {
    //         successRedirect: app.locals.AUTH_REDIRECT,
    //         failureRedirect: app.locals.AUTH_LOGIN,
    //         failureFlash: true,
    //         badRequestMessage: "Missing credentials!"
    //     })
    // );

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
                // app.locals.user = user;
                return res.redirect(app.locals.AUTH_REDIRECT);
            });
        })(req, res, next);
    });

    router.get('/logout', function(req, res) {
        req.logout();
        // app.locals.user = null;
        res.redirect(app.locals.AUTH_REDIRECT);
    });

    router.get('/signup', function(req, res) {
        if (req.isAuthenticated())
            return res.redirect(app.locals.AUTH_REDIRECT);
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
                return res.redirect(app.locals.AUTH_REDIRECT);
            });
        });
    });

    //facebook auth.
    app.get('/auth/facebook',
        passport.authenticate('facebook'));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            failureRedirect: '/login'
        }),
        function(req, res) {
            console.log(arguments)
            res.redirect('/auth');
        });

    //twitter auth.
    app.get('/auth/twitter',
        passport.authenticate('twitter'));

    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            failureRedirect: '/login'
        }),
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/auth');
        });

    return router;
};
