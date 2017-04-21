/* eslint-disable no-invalid-this */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Boom = require('boom');
const uniqueValidator = require('mongoose-unique-validator');
require('mongoose-type-email');
const SALT_WORK_FACTOR = 10;

const schema = mongoose.Schema({
    name: {
        first: {type: String, required: true},
        last: {type: String, required: true}
    },
    email: {
        type: mongoose.SchemaTypes.Email,
        required: [true, 'Email is required'],
        unique: 'Email is already taken'
    },
    password: {type: String, required: true}
}, {
    timestamps: true
});


// Allow for custom message on unique errors
schema.plugin(uniqueValidator);

// Before saving entry, hash the password if it's modified
schema.pre('save', function pre(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    // Generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
        if (err) return next(err);

        // Hash the password using our new salt
        bcrypt.hash(this.password, salt, (_err, hash) => {
            if (_err) return next(_err);

            // Override the cleartext password with the hashed one
            this.password = hash;
            next();
        });
    });
});

schema.methods.comparePassword = function comparePassword(pass) {
    return new Promise((res, rej) => {
        bcrypt.compare(pass, this.password, (err, isMatch) => {
            if (err) rej(err);
            else res(isMatch);
        });
    });
};

const model = mongoose.model('user', schema);

model.ignore = {
    create: true
};

model.login = async function login(email, password) {
    const user = await model.findOne({email});
    if (!user) throw new Boom.badRequest('No user found');

    if (user.comparePassword(password)) return user;
};


module.exports = model;
