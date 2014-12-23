'use strict';

/** @module config */

/**
 * This callback type is called `callback` and is displayed as a global symbol.
 *
 * @callback callback
 * @param {?*} err - error argument
 * @param {?*} result - result argument
 */

var _ = require('lodash');

// Load app configuration
module.exports = _.merge(
  require(__dirname + '/../config/env/all.js'),
  require(__dirname + '/../config/env/' + process.env.NODE_ENV + '.js') || {}
);
