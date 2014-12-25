'use strict';

/*
 * First we set the node enviornment variable if not set before
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/*
 * Load Newrelic monitoring
 */
if (process.env.NODE_ENV == 'production')
  require('newrelic');

/*
 * Module dependencies.
 */
var config = require('./app/config');
console.log('CONFIG', config);

// Bootstrap db connection
var mongoose = require('mongoose');
var db = mongoose.connect(config.db);

// Init the express application
var app = require('./app/config/express')(db);

// Start the app by listening on <port>
var http = app.listen(config.port);

// Attach WebSocket
var io = require('./app/config/socket').io;
io.attach(http);

// Expose app
exports = module.exports = app;

// Logging initialization
console.log('Express app started on port ' + config.port);
