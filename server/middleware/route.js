/* eslint-disable new-cap */

const Boom = require('boom');

/**
 * Express middleware for adding 405 responses to routes
 *
 * @param  {string} path   Route path
 * @param  {Router} router Express Router
 * @return {Route}         Express Route
 */
module.exports = (path, router) =>
    router.route(path)
        .all((req, res, next) => {
            if (!req.route.methods[req.method.toLowerCase()]) {
                throw new Boom.methodNotAllowed();
            } else next();
        });
