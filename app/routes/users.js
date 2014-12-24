'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var async = require('async');

var UserModel = require('../models/user');

var paginate = require('../plugins/listUtils').paginate;

/* filter*/
var filter = require('../plugins/listUtils').filter;

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function isAuthenticated(req, res, next) {
  console.log(req.user);
  res.locals.user = req.isAuthenticated() ? req.user : null;
  if (!req.isAuthenticated())
    return res.redirect('/auth/login');
  next();
}

/* GET home page. */
router.get('/', isAuthenticated, function (req, res, next) {
  res.render('index.html', {
    title: "My ProtoPixel Polymer"
  });
});

router.get('/user/:id', function (req, res, next) {

  UserModel.findById(req.params.id).exec(function (err, user) {
    // console.log(err, user);
    if (err)
      return next(err);
    if (user) {
      res.render('users/user.html', {
        title: toTitleCase(user.name),
        user: user
      });
    } else {
      next();
    }
  });

});


module.exports = router;
