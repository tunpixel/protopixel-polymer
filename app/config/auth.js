'use strict';

var ROUTES = {
  URL: 'http://localhost:' + (process.env.PORT || 3000),
  AUTH_HOME: '/auth',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_SIGNUP: '/auth/signup',
  AUTH_LINK: '/auth/link',
  AUTH_UNLINK: '/auth/unlink',
};

exports.ROUTES = ROUTES;

function isAuthenticated(req, res, next) {
  console.log(req.user);
  res.locals.user = req.isAuthenticated() ? req.user : null;
  if (!req.isAuthenticated())
    return res.redirect(ROUTES.AUTH_LOGIN);
  next();
}

exports.isAuthenticated = isAuthenticated;
