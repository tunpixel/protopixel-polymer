'use strict';

var ROUTES = {
  URL: 'http://localhost:' + (process.env.PORT || 3000),
  AUTH_HOME: '/auth',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_SIGNUP: '/auth/signup',
  AUTH_LINK: '/auth/link',
  AUTH_UNLINK: '/auth/unlink',
  AUTH_FORGOT: '/auth/forgot',
  AUTH_RESET: 'auth/reset'
};

module.exports = ROUTES;
