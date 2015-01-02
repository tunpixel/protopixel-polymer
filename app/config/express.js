'use strict';

/** @module config/express */

/*
 * Module dependencies.
 */
var express = require('express');

var morgan = require('morgan');

var session = require('express-session');
var mongoStore = require('connect-mongo')({
  session: session
});
var cookieParser = require('cookie-parser');

var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var flash = require('connect-flash');
var favicon = require('serve-favicon');

var compress = require('compression');

var helmet = require('helmet');

var consolidate = require('consolidate');
var swig = require('swig');

var passport = require('passport');

var path = require('path');

var intl = require('intl');

var config = require('./');
var ROUTES = require('./routes');


module.exports = function (db) {

  // Initialize express app
  var app = express();

  // Setting application local variables
  // app.locals.config = config;
  app.locals.title = config.app.title;
  app.locals.description = config.app.description;
  app.locals.keywords = config.app.keywords;
  app.locals.url = config.app.url;
  app.locals.ROUTES = ROUTES;

  // Initialize models
  require('./../models/user.js');


  // Should be placed before express.static
  app.use(compress({
    filter: function (req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  // Showing stack errors
  app.set('showStackError', true);

  // Set swig as the template engine
  require('./swig')(swig, app);
  // app.engine('html', swig.renderFile);
  app.engine('html', consolidate.swig);

  // Set views path and view engine
  app.set('view engine', 'html');
  app.set('views', './app/views');

  // Enable logger (morgan)
  if (process.env.NODE_ENV == 'development')
    app.use(morgan('dev'));

  // Environment dependent middleware
  if (process.env.NODE_ENV == 'development') {
    app.set('view cache', false); // Disable views cache
  } else if (process.env.NODE_ENV == 'production') {
    app.locals.cache = 'memory';
  }

  // Request body parsing middleware should be above methodOverride
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  // CookieParser should be above session
  app.use(cookieParser());

  // Express MongoDB session storage
  app.use(session({
    saveUninitialized: true,
    resave: true,
    secret: config.sessionSecret,
    store: new mongoStore({
      db: db.connection.db,
      collection: config.sessionCollection
    }),
    cookie: config.sessionCookie,
    name: config.sessionName
  }));

  // use passport session
  require('./passport')(passport);
  app.use(passport.initialize());
  app.use(passport.session());

  // connect flash for flash messages
  app.use(flash());
  app.use(function (req, res, next) {
    var render = res.render;
    res.render = function () {
      res.locals.messages = req.flash();
      render.apply(res, arguments);
    }
    var json = res.json;
    res.json = function () {
      res.locals.messages = req.flash();
      json.apply(res, arguments);
    }
    next();
  });

  // Passing user to environment locals
  app.use(function (req, res, next) {
    res.locals.user = req.isAuthenticated() ? req.user : null;
    next();
  });

  // Use helmet to secure Express headers
  app.use(helmet.xframe());
  app.use(helmet.xssFilter());
  app.use(helmet.nosniff());
  app.use(helmet.ienoopen());
  app.disable('x-powered-by');

  // Setting the app router and static folder
  // app.use(favicon(path.resolve('./public/favicon.ico')));
  app.use(express.static(path.resolve('./public')));

  app.use(require('prerender-node'));

  // Load routes
  app.use('/auth', require('./../routes/auth'));

  // var auth = require('./../middlewares/auth');

  // app.get('/', auth.authenticatedAccessMiddleware, function (req, res, next) {
  //   res.render('index.html');
  // });

  app.get('/', function (req, res, next) {
    res.redirect('/auth');
  });

  /*
   * Unauthorized access handler
   */
  app.use(function (err, req, res, next) {
    if (err.status !== 401)
      return next(err);
    if (req.xhr)
      res.json(401, {
        success: false,
        message: "Unauthorized Access"
      });
    else
      res.redirect(ROUTES.AUTH_LOGIN);
  });

  /*
   * development error handler
   * will print stacktrace
   */
  if (process.env.NODE_ENV == 'development')
    app.use(function (err, req, res, next) {
      console.error(err.stack);
      res.status(err.status || 500);
      if (req.xhr)
        res.json({
          success: false,
          message: err.message,
          error: err
        });
      else
        res.render('error', {
          message: err.message,
          error: err
        });
    });

  /*
   * production error handler
   * no stacktraces leaked to user
   */
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    if (req.xhr)
      res.json({
        success: false,
        message: err.message
      });
    else
      res.render('error', {
        message: err.message
      });
  });

  // Assume 404 since no middleware responded
  if (process.env.NODE_ENV != 'development')
    app.use(function (req, res) {
      if (req.xhr)
        res.json({
          url: req.originalUrl,
          error: 'Not Found'
        });
      res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not Found'
      });
    });

  console.log('LOCALS', app.locals);
  // console.log('ROUTES', app._router.stack);

  return app;
};
