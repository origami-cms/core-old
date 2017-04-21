const mongoose = require('mongoose');
const request = require('co-request');
const wrap = require('co-express');

const auth = require('../../server/middleware/auth');

module.exports = router => {
    const Theme = mongoose.models.theme;

    router.route('/theme')
        .get(auth, wrap(function *get(req, res, next) {
            const t = req.app.theme;
            const pages = yield t.pages();
            const templates = yield t.templates();
            res.text = 'Sucessfully retrieved theme';
            res.data = {
                name: t.name,
                pages,
                templates
            };
            next();
        }));

    router.route('/theme/installed')
        .get(auth, wrap(function *get(req, res, next) {
            res.data = yield Theme.list();
            next();
        }));

    // Install and remove themes to the site/themes/ directory
    router.route('/theme/install/:theme')
        .post(auth, wrap(function *post(req, res, next) {
            yield Theme.install(req.params.theme);
            res.text = 'Sucessfully install theme';
            next();
        }));

    router.route('/theme/:theme')
        .delete(auth, wrap(function *remove(req, res, next) {
            yield Theme.uninstall(req.params.theme);
            res.text = 'Sucessfully uninstalled theme';
            next();
        }));

    // Activate the theme
    router.route('/theme/:theme/activate')
        .post(auth, wrap(function *post(req, res, next) {
            yield Theme.activate(req.params.theme);
            res.text = 'Sucessfully activated theme';
            next();
        }));


    // Search npm for a theme
    // @see https://api-docs.npms.io/
    router.route('/theme/search')
        .get(auth, wrap(function *get(req, res, next) {
            const q = req.query.q ? `-${req.query.q}` : '';
            const url = `https://api.npms.io/v2/search?q=origami-theme${q}`;
            const data = yield request(url);
            res.data = JSON.parse(data.body).results;
            next();
        }));
};
