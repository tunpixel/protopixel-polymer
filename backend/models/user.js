'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  bcrypt = require('bcrypt-nodejs'),
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

  resetPasswordToken: String,
  resetPasswordExpires: Date,

  facebook: {
    id: String
  },

  twitter: {
    id: String
  },

  google: {
    id: String
  },

  local: {
    signup: {
      type: Boolean,
      default: false
    },
    connected: {
      type: Boolean,
      default: false
    },
  },

  tokenValidation: String,

  isValid: {
    type: Boolean,
    default: false
  },



  picture: String,

  score: {
    type: Number,
    default: 0
  },

  favs: [{
    type: ObjectId,
    ref: 'User'
  }],

  meta: {
    favs: {
      type: Number,
      default: 0
    },

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

/**
 * Virtuals
 */
UserSchema.virtual('name').get(function () {
  return this.firstname + ' ' + this.lastname;
});

/**
 * Statics
 */
UserSchema.statics.load = function (id, cb) {
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
//====================================

UserSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};


//====================================
// end methods =======================
//====================================

var UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
