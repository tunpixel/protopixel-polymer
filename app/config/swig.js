'use strict';

var config = require('./config');

module.exports = function(swig, app) {

	function number(input) {
		return new Number(input).toLocaleString('fr-FR');
	}
	swig.setFilter('number', number);

	var moment = require('moment');

	moment.locale('fr_FR');

	function fromNow(dateString) {
		var datetime = moment(dateString);
		return datetime.isBefore(moment().subtract('days', 1)) ? datetime.calendar() : datetime.fromNow();
	}
	swig.setFilter('fromNow', fromNow);

	swig.setDefaults({
		locals: {
			now: function() {
				return new Date();
			}
		}
	});

	// NOTE: You should always cache templates in a production environment.
	// Don't leave both of these to `false` in production!
	if (app.get('env') == 'development') {
		// Swig will cache templates for you, but you can disable
		// that and use Express's caching instead, if you like:
		// app.set('view cache', false);
		// To disable Swig's cache, do the following:
		swig.setDefaults({
			cache: false
		});
	}

};
