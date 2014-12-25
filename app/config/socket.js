'use strict';

/** @module config/socket */

var config = require('./');

// var session = require('express-session')({
//   secret: config.sessionSecret
// });
// var cookieParser = require('cookie-parser')();

// var passport = require('passport');

var io = require('socket.io')({
  // serveClient: false,
  // allowRequest: function allowRequest(req, callback) {
  //   console.log('allowRequest', arguments);
  //   callback(null, true);
  // }
});

var user = io.of('/user');

// user.use(function (socket, next) {
//   var req = socket.handshake;
//   var res = {};
//   cookieParser(req, res, function (err) {
//     if (err) return next(err);
//     session(req, res, next);
//   });
// });

user.on('connection', function (socket) {

  console.log('a user connected');

  // console.log(socket.request.user);
  // console.log('handshake', socket.handshake);
  console.log('socket socket.handshake.session', socket.handshake.session);
  // console.log('socket session user', socket.handshake.session.user);

  // console.log('user', socket.handshake.user);
  // socket.join('user:' + req.user.id);

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });

  setTimeout(function () {
    socket.emit('notification', {
      message: "Hello!",
      url: '/...'
    });
  }, 10000);

});


exports.io = io;
exports.user = user;
