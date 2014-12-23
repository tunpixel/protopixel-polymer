'use strict';

/** @module common/hooks */

var mongoose = require('mongoose');

var _ = require('lodash'),
  async = require('async');


/*
 * update user score, used after opinion create/update
 * a user score is the number of submitted opinions by that user
 * TODO: consider multiple points for verified restaurants
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

function HookRunner() {
  if (!(this instanceof HookRunner)) return new HookRunner();

  EventEmitter.call(this);

  // var self = this;
  // setTimeout(function timeoutCb() {
  //   self.emit('myEvent', 'hello world', 42);
  // }, 1000);
}
util.inherits(HookRunner, EventEmitter);

// exports.HookRunner = HookRunner;

var runner = new HookRunner();

exports.runner = runner;

function updateUserScore(userId, callback) {
  if (!callback)
    callback = function () {};

  var OpinionModel = mongoose.model('Opinion');
  var UserModel = mongoose.model('User');

  OpinionModel.count(_.merge(_.clone(OpinionModel.validQuery), {
    'meta.createdBy.id': userId
  }), function (err, score) {
    // console.log(arguments);
    if (err)
      return callback(err, null);

    UserModel.findByIdAndUpdate(userId, {
      $set: {
        score: score
      }
    }, callback);
  });
}

runner.on('updateUserScore', updateUserScore);
exports.updateUserScore = updateUserScore;

function updateRestaurantMeta(restaurantId, callback) {
  if (!callback)
    callback = function () {};

  var OpinionModel = mongoose.model('Opinion');
  var RestaurantModel = mongoose.model('Restaurant');

  OpinionModel.aggregate([{
    $match: _.merge(_.clone(OpinionModel.validQuery), {
      'restaurant.id': restaurantId
    })
  }, {
    $group: {
      _id: '$restaurant.id',
      score: {
        $avg: '$value'
      },
      totalReviews: {
        $sum: 1
      },
      totalFavs: {
        $sum: '$meta.favs'
      }
    }
  }], function (err, results) {
    // console.log(arguments);
    if (err)
      return callback(err, null);

    var result = results[0];
    RestaurantModel.findByIdAndUpdate(restaurantId, {
      $set: {
        'meta.totalReviews': result ? parseInt(result.totalReviews) : 0,
        'meta.totalFavs': result ? parseInt(result.totalFavs) : 0,
        'meta.score': result ? parseFloat(result.score) : 0
      }
    }, callback);
  });
}

runner.on('updateRestaurantMeta', updateRestaurantMeta);
exports.updateRestaurantMeta = updateRestaurantMeta;

function updateRestaurantPicture(restaurantId, picture, callback) {
  if (!callback)
    callback = function () {};

  var RestaurantModel = mongoose.model('Restaurant');

  RestaurantModel.findByIdAndUpdate(restaurantId, {
    $set: {
      'picture': picture
    },
    $addToSet: {
      'pictures': picture
    }
  }, callback);

}

runner.on('updateRestaurantPicture', updateRestaurantPicture);
exports.updateRestaurantPicture = updateRestaurantPicture;

function updateRestaurantsWithUserName(userId, userName, callback) {
  if (!callback)
    callback = function () {};


  var RestaurantModel = mongoose.model('Restaurant');

  RestaurantModel.update({
    'meta.createdBy.id': userId,
    'meta.createdBy.name': {
      $ne: userName
    }
  }, {
    $set: {
      'meta.createdBy.name': userName
    }
  }, {
    multi: true
  }).exec(function (err, numberAffected, raw) {
    if (err)
      console.error(err);
    if (numberAffected)
      console.log(numberAffected, 'records updated.');
    callback(err, numberAffected);
  });

}

runner.on('updateRestaurantsWithUserName', updateRestaurantsWithUserName);
exports.updateRestaurantsWithUserName = updateRestaurantsWithUserName;

function updatePlatesWithUserName(userId, userName, callback) {
  if (!callback)
    callback = function () {};


  var PlateModel = mongoose.model('Plate');

  PlateModel.update({
    'meta.createdBy.id': userId,
    'meta.createdBy.name': {
      $ne: userName
    }
  }, {
    $set: {
      'meta.createdBy.name': userName
    }
  }, {
    multi: true
  }).exec(function (err, numberAffected, raw) {
    if (err)
      console.error(err);
    if (numberAffected)
      console.log(numberAffected, 'records updated.');
    callback(err, numberAffected);
  });

}

runner.on('updatePlatesWithUserName', updatePlatesWithUserName);
exports.updatePlatesWithUserName = updatePlatesWithUserName;


function updatePairMeta(restaurantId, restaurantName, plateId, plateName, callback) {
  if (!callback)
    callback = function () {};


  var OpinionModel = mongoose.model('Opinion');
  var PairModel = mongoose.model('Pair');

  OpinionModel.aggregate([{
    $match: _.merge(_.clone(OpinionModel.validQuery), {
      'restaurant.id': restaurantId,
      'plate.id': plateId
    })
  }, {
    $group: {
      _id: '$restaurant.id',
      score: {
        $avg: '$value'
      },
      totalReviews: {
        $sum: 1
      },
      totalFavs: {
        $sum: '$meta.favs'
      }
    }
  }], function (err, results) {
    // console.log(arguments);
    if (err)
      return callback(err, null);

    var result = results[0];
    PairModel.findOneAndUpdate({
      'restaurant.id': restaurantId,
      'plate.id': plateId
    }, {
      $set: {
        'restaurant.id': restaurantId,
        'restaurant.name': restaurantName,
        'plate.id': plateId,
        'plate.name': plateName,
        'meta.totalReviews': result ? parseInt(result.totalReviews) : 0,
        'meta.totalFavs': result ? parseInt(result.totalFavs) : 0,
        'meta.score': result ? parseFloat(result.score) : 0
      }
    }, {
      upsert: true
    }, callback);
  });
}

runner.on('updatePairMeta', updatePairMeta);
exports.updatePairMeta = updatePairMeta;


function updatePairsMetaForRestaurant(restaurantId, restaurantName, callback) {
  if (!callback)
    callback = function () {};


  var PairModel = mongoose.model('Pair');

  PairModel.find({
    'restaurant.id': restaurantId
  }, {
    plate: 1
  }).sort({
    'plate.id': 1
  }).exec(function (err, pairs) {

    var lastPair = null;
    var duplicates = _.remove(pairs, function (pair) {
      if (!lastPair)
        return false;
      var r = pair.plate.id == lastPair.plate.id;
      lastPair = pair;
      return r;
    });

    async.series([

        function updatePair(callback) {
          // update each pair found
          async.eachLimit(pairs, 10,
            function iterator(pair, callback) {
              updatePairMeta(restaurantId, restaurantName, pair.plate.id, pair.plate.name, function (err, x) {
                // console.log(arguments);
                // console.log("SUCCESS Updating Restaurant-Plate");
                callback(err);
              });
            },
            callback(err, 'one'));
        },
        function removeRedundant(callback) {
          // pair.remove()
          async.eachLimit(duplicates, 10,
            function iterator(pair, callback) {
              PairModel.findByIdAndRemove(pair._id, callback(err));
            },
            callback(err, 'two'));
        }
      ],
      // optional callback
      function (err, results) {
        if (err) {
          console.error(err);
          return callback(err);
        } else callback();
      });
  });
}

runner.on('updatePairsMetaForRestaurant', updatePairsMetaForRestaurant);
exports.updatePairsMetaForRestaurant = updatePairsMetaForRestaurant;


function updatePairsMetaForPlate(plateId, plateName, callback) {
  if (!callback)
    callback = function () {};


  var PairModel = mongoose.model('Pair');

  PairModel.find({
    'plate.id': plateId
  }, {
    restaurant: 1
  }).sort({
    'restaurant.id': 1
  }).exec(function (err, pairs) {

    var lastPair = null;
    var duplicates = _.remove(pairs, function (pair) {
      if (!lastPair)
        return false;
      var r = pair.plate.id == lastPair.plate.id;
      lastPair = pair;
      return r;
    });

    async.series([

        function updatePair(callback) {
          // update each pair found
          async.eachLimit(pairs, 10,
            function iterator(pair, callback) {
              updatePairMeta(plateId, plateName, pair.restaurant.id, pair.restaurant.name, function (err, x) {
                // console.log(arguments);
                // console.log("SUCCESS Updating Restaurant-Plate");
                callback();
              });
            },
            callback(err, 'one'));
        },
        function removeRedundant(callback) {
          // pair.remove()
          async.eachLimit(duplicates, 10,
            function iterator(pair, callback) {
              PairModel.findByIdAndRemove(pair._id, callback());
            },
            callback(err, 'two'));
        }
      ],
      // optional callback
      function (err, results) {
        if (err) {
          console.error(err);
          callback(err);
        } else callback();
      });
  });

}

runner.on('updatePairsMetaForPlate', updatePairsMetaForPlate);
exports.updatePairsMetaForPlate = updatePairsMetaForPlate;


function updateOpinionsWithUserName(userId, userName, callback) {
  if (!callback)
    callback = function () {};


  var OpinionModel = mongoose.model('Opinion');

  OpinionModel.update({
    'meta.createdBy.id': userId,
    'meta.createdBy.name': {
      $ne: userName
    }
  }, {
    $set: {
      'meta.createdBy.name': userName
    }
  }, {
    multi: true
  }).exec(function (err, numberAffected, raw) {
    if (err)
      console.error(err);
    if (numberAffected)
      console.log(numberAffected, 'records updated.');
    callback(err, numberAffected);
  });

}

runner.on('updateOpinionsWithUserName', updateOpinionsWithUserName);
exports.updateOpinionsWithUserName = updateOpinionsWithUserName;


function updateOpinionsWithUserScore(userId, userScore, callback) {
  if (!callback)
    callback = function () {};


  var OpinionModel = mongoose.model('Opinion');

  OpinionModel.update({
    'meta.createdBy.id': userId
  }, {
    $set: {
      'meta.createdBy.score': userScore
    }
  }, {
    multi: true
  }).exec(function (err, numberAffected, raw) {
    if (err)
      console.error(err);
    if (numberAffected)
      console.log(numberAffected, 'records updated.');
    callback(err, numberAffected);
  });

}

runner.on('updateOpinionsWithUserScore', updateOpinionsWithUserScore);
exports.updateOpinionsWithUserScore = updateOpinionsWithUserScore;


function updateOpinionsWithRestaurantName(restaurantId, restaurantName, callback) {
  if (!callback)
    callback = function () {};


  var OpinionModel = mongoose.model('Opinion');

  OpinionModel.update({
    'restaurant.id': restaurantId,
    'restaurant.name': {
      $ne: restaurantName
    }
  }, {
    $set: {
      'restaurant.name': restaurantName
    }
  }, {
    multi: true
  }).exec(function (err, numberAffected, raw) {
    if (err)
      console.error(err);
    if (numberAffected)
      console.log(numberAffected, 'records updated.');
    callback(err, numberAffected);
  });

}

runner.on('updateOpinionsWithRestaurantName', updateOpinionsWithRestaurantName);
exports.updateOpinionsWithRestaurantName = updateOpinionsWithRestaurantName;


function updateOpinionsWithPlateName(plateId, plateName, callback) {
  if (!callback)
    callback = function () {};


  var OpinionModel = mongoose.model('Opinion');

  OpinionModel.update({
    'plate.id': plateId,
    'plate.name': {
      $ne: plateName
    }
  }, {
    $set: {
      'plate.name': plateName
    }
  }, {
    multi: true
  }).exec(function (err, numberAffected, raw) {
    if (err)
      console.error(err);
    if (numberAffected)
      console.log(numberAffected, 'records updated.');
    callback(err, numberAffected);
  });

}

runner.on('updateOpinionsWithRestaurantName', updateOpinionsWithRestaurantName);
exports.updateOpinionsWithRestaurantName = updateOpinionsWithRestaurantName;


function updatePairsWithRestaurantName(restaurantId, restaurantName, callback) {
  if (!callback)
    callback = function () {};


  var PairModel = mongoose.model('Pair');

  PairModel.update({
    'restaurant.id': restaurantId,
    'restaurant.name': {
      $ne: restaurantName
    }
  }, {
    $set: {
      'restaurant.name': restaurantName
    }
  }, {
    multi: true
  }).exec(function (err, numberAffected, raw) {
    if (err)
      console.error(err);
    if (numberAffected)
      console.log(numberAffected, 'records updated.');
    callback(err, numberAffected);
  });

}

runner.on('updatePairsWithRestaurantName', updatePairsWithRestaurantName);
exports.updatePairsWithRestaurantName = updatePairsWithRestaurantName;


function updatePairsWithPlateName(plateId, plateName, callback) {
  if (!callback)
    callback = function () {};


  var PairModel = mongoose.model('Pair');

  PairModel.update({
    'plate.id': plateId,
    'plate.name': {
      $ne: plateName
    }
  }, {
    $set: {
      'plate.name': plateName
    }
  }, {
    multi: true
  }).exec(function (err, numberAffected, raw) {
    if (err)
      console.error(err);
    if (numberAffected)
      console.log(numberAffected, 'records updated.');
    callback(err, numberAffected);
  });

}

runner.on('updatePairsWithPlateName', updatePairsWithPlateName);
exports.updatePairsWithPlateName = updatePairsWithPlateName;
