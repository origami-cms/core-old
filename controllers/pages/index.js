const mongoose = require('mongoose');
const express = require('express');
const wrap = require('co-express');

// Routes to not serve to theme because they are reserved
const protect = ['api', 'admin'];

const lookupPage = function *(url) {
    return yield mongoose.models.page.findOne({url});
};

module.exports = app => {
    const router = new express.Router();

    router.use(wrap(function *(req, res, next) {
        const r = new RegExp(`^/(${protect.join('|')})/`);
        if (r.test(req.url)) return next();

        const page = yield lookupPage(req.url);
        if (page) {
            const html = yield req.app.theme.render(page.template.name, {
                site: {
                    title: 'Heya'
                },
                page
            });
            res.send(html);
        } else res.status(404).send('Not found');
    }));

    app.server.use(router);
};
