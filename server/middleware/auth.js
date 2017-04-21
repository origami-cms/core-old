const middleware = require('express-jwt');
const jwt = require('jsonwebtoken');
const config = require('../../lib/config');

/**
 * Express middleware for protecting resource with authentication
 * @return {Function} Express middleware function that checks JWT and assigns
 *                    user to req
 */
module.exports = middleware({secret: config.secret});

module.exports.generate = user => {
    const timeout = 30;
    user.iat = Math.floor(Date.now() / 1000) + timeout;

    return jwt.sign(user, config.secret);
};
