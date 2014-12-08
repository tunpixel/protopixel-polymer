'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var session = require('express-session');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var compress = require('compression');

var swig = require('swig');
var mongoose = require('mongoose');
var passport = require('passport');

var intl = require('intl');

var app = express();

var config = require('./app/config/config');

app.locals.AUTH_REDIRECT = '/';
app.locals.AUTH_LOGIN = '/auth/login';
app.locals.AUTH_LOGOUT = '/auth/logout';
app.locals.AUTH_SIGNUP = '/auth/signup';

var db = mongoose.connect(config.db);

// view engine setup
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'app/views'));

require('./app/config/swig.js')(swig, app);


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(compress());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(cookieParser());
app.use(session({
  secret: config.sessionSecret
}));
app.use(flash());

require('./app/config/passport.js')(passport);
app.use(passport.initialize());
app.use(passport.session());


app.use(express.static(path.join(__dirname, 'public')));

app.use(require('prerender-node'));


app.use('/auth', require('./app/routes/routes')(app, passport));
app.use('/', require('./app/routes/users'));


// catch 404 and forward to error handler
if (app.get('env') !== 'development') {
  app.use(function(req, res, next) {
    res.render('404');
  });
}

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Start the app by listening on <port>
app.listen(config.port);

// Logging initialization
console.log('Express app started on port ' + config.port);

module.exports = app;
