'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt-nodejs'), //cryp
    ObjectId = mongoose.Schema.ObjectId;

var TrimmedString = {
    type: String,
    trim: true
};

/**
 * User Schema
 */
var UserSchema = new Schema({
    firstname: TrimmedString,
    lastname: TrimmedString,
    gender: {
        type: String,
        enum: ['male', 'female', 'unknown'],
        default: 'unknown'
    },
    email: TrimmedString,
    password: String,

    picture: String,
    score: {
        type: Number,
        default: 0
    },

    facebook: Schema.Types.Mixed,

    twitter: Schema.Types.Mixed,

    meta: {
        createdOn: {
            type: Date,
            default: Date.now
        },
        facebookId: {
            type: String,
            index: true
        },
        facebookSignup: {
            type: Boolean,
            default: false,
            index: true
        },
        moderator: {
            type: Boolean,
            default: false
        },
        draft: {
            type: Boolean,
            default: false
        },
        banned: {
            type: Boolean,
            default: false
        }
    }

});

// UserSchema.plugin(troop.basicAuth);
// UserSchema.plugin(troop.timestamp);


// UserSchema.pre('save', function(next) {
//     var user = this;
//     if (!user.isModified('password')) return next();
//     bcrypt.genSalt('!!@#@FSDV@#QCWCR@#$CQWC', function(err, salt) {
//         if (err) return next(err);
//         bcrypt.hash(user.password, salt, function(err, hash) {
//             if (err) return next(err);
//             user.password = hash;
//             next();
//         });
//     });
// });

/**
 * Validations
 */
// UserSchema.path('title').validate(function(title) {
//     return title.length;
// }, 'Title cannot be blank');

/**
 * Virtuals
 */
UserSchema.virtual('name').get(function() {
    return this.firstname + ' ' + this.lastname;
});

/**
 * Statics
 */
UserSchema.statics.load = function(id, cb) {
    this.findOne({
        _id: id
    }).select('-hash').exec(cb);
};

UserSchema.statics.onUserChange = function onUserChange(user) {

    if (user.isModified('firstname') || user.isModified('lastname')) {
        console.log('user changed');
        // update
    }
};

UserSchema.post('save', UserSchema.statics.onUserChange);



/**
 * Registration
 */
UserSchema.set('toObject', {
    virtuals: true
});
UserSchema.set('toJSON', {
    virtuals: true
});

//====================================
// auth methods ======================
// generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    // return bcrypt.compareSync(password, this.password);
    return password === this.password;
};
//====================================
// end methods =======================
//====================================

var UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
