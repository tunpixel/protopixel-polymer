'use strict';

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId;

module.exports = exports = function creationMetaPlugin(schema, options) {

    schema.add({

        'meta.createdBy': {
            id: {
                type: ObjectId,
                ref: 'User',
                default: null
            },
            name: {
                type: String,
                default: 'User'
            }
        },

        'meta.createdOn': {
            type: Date,
            default: Date.now
        },

        'meta.updatedOn': Date,

        'meta.verified': {
            type: Boolean,
            default: false
        },

    });

    schema.pre('save', function(next) {
        this.meta.updatedOn = new Date();
        next();
    });

    if (options && options.index) {
        schema.path('meta.updatedOn').index(options.index);
    }

};
