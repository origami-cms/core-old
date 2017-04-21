const express = require('express');

const auth = require('./auth');
const admin = require('./admin');
const models = require('./models');
const theme = require('./theme');
const uploads = require('./uploads');

module.exports = (app, config) => {
    const router = express.Router();
    auth(router);
    admin(router);
    models(router);
    theme(router);
    uploads(router, config.uploads);

    app.server.use('/api/v1/', router);
};
