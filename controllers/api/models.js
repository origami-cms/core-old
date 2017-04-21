const mongoose = require('mongoose');
const Boom = require('boom');
const co = require('co');

const route = require('../../server/middleware/route');
const auth = require('../../server/middleware/auth');


/**
 * Generates automatic routes based on models
 * @param {Router} router - ExpressJS router
 *
 * EG: Given a resource name of `user`
 * Generates routes:
 *     GET /user/
 *     POST /user/
 *     GET /user/:id
 *     DELETE /user/:id
 *     PUT /user/:id
 */
module.exports = router => {
    Object.keys(mongoose.models).forEach(name => {
        const model = mongoose.models[name];
        if (model.automatic == false) return;

        router.use(auth);
        const routerBase = route(`/${name}`, router);

        if (!model.ignore) model.ignore = {};

        if (!model.ignore.list === true) {
            // Get the root resource and return an unfiltered list
            // GET /resource
            routerBase.get((req, res, next) => {
                co(function *get() {
                    res.text = `Sucessfully retrieved ${name}s`;
                    res.data = yield model.find();
                    next();
                });
            });
        }

        if (!model.ignore.create === true) {
            // Create a new resource
            // POST /resource
            routerBase.post((req, res, next) => {
                co(function *post() {
                    try {
                        res.text = `Sucessfully created ${name}`;
                        res.data = yield model.create(req.body);
                        next();
                    } catch (e) {
                        const code = 422;
                        next(new Boom.create(
                            code,
                            `Error creating ${name}`,
                            {errors: e.errors}
                        ));
                    }
                });
            });
        }


        const routerID = route(`/${name}/:id`, router);

        if (!model.ignore.get === true) {
            // Retrieve a resource by it's id
            // GET /resource/id
            routerID.get((req, res, next) => {
                co(function *get() {
                    try {
                        const resource = yield model.findById(req.params.id);
                        if (resource) res.send(resource);
                    } catch (e) {
                        next(new Boom.notFound());
                    }
                });
            });
        }

        if (!model.ignore.delete === true) {
            // Delete a resource by it's id
            // DELETE /resource/id
            routerID.delete((req, res, next) => {
                co(function *remove() {
                    yield model.findByIdAndRemove(req.params.id).exec();
                    res.text = `Sucessfully deleted ${name}`;
                    next();
                });
            });
        }

        if (!model.ignore.update === true) {
            // Update a resource by it's id
            // PUT /resource/id
            routerID.put((req, res, next) => {
                co(function *put() {
                    yield model.findByIdAndUpdate(req.params.id, req.body);
                    res.text = `Sucessfully updated ${name}`;
                    next();
                });
            });
        }
    });
};
