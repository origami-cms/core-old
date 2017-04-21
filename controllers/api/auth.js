const express = require('express');
const mongoose = require('mongoose');
const Boom = require('boom');
const wrap = require('co-express');
const auth = require('../../server/middleware/auth');

module.exports = router => {
    const User = mongoose.models.user;
    const admin = express.Router();

    admin.route('/signup')
        .post(wrap(function *get(req, res, next) {
            try {
                const user = yield User.create(req.body);
                res.data = {jwt: auth.generate(user)};
                next();

            } catch (e) {
                const code = 400;
                next(new Boom.create(
                    code, 'Error signing up', {errors: e.errors}
                ));
            }
        }));

    admin.route('/login')
        .post(wrap(function *get(req, res, next) {
            const {email, password} = req.body;
            const user = yield User.login(email, password);
            if (!user) throw new Boom.badRequest('Password was incorrect');

            res.text = 'Sucessfully logged in';
            res.data = {jwt: auth.generate(user)};
            next();
        }));

    router.use('/auth', admin);
};
