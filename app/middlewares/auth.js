'use strict';

/** @module middlewares */

/**
 * An Express middleware
 * @typedef {Function} Middleware
 */

var config = require('./../config');

var ROUTES = require('./../config/routes');

/** publicAccessMiddleware */
function publicAccessMiddleware(err, req, res, next) {
  console.log('publicAccessMiddleware', err, req.isAuthenticated(), req.user);
  if (err && err.status === 401 && err.name == 'UnauthorizedError') {
    req.user = null;
  }
  next();
}

/** authenticatedAccessMiddleware */
function authenticatedAccessMiddleware(req, res, next) {
  console.log('authenticatedAccessMiddleware', req.isAuthenticated(), req.user);
  if (!req.isAuthenticated()) {
    return next({
      status: 401,
      name: 'UnauthorizedError'
    });
  }
  next();
}

/** @function hybridAccessMiddleware */
var hybridAccessMiddleware = [authenticatedAccessMiddleware, publicAccessMiddleware];

exports.publicAccessMiddleware = publicAccessMiddleware;
exports.authenticatedAccessMiddleware = authenticatedAccessMiddleware;
exports.hybridAccessMiddleware = hybridAccessMiddleware;
