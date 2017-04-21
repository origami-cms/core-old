const express = require('express');
const body = require('body-parser');

const errors = require('./middleware/errors');
const controllers = require('../controllers');
const Theme = require('../lib/theme');

module.exports = class Server {

    constructor(config, db) {
        this.server = express();
        this.config = config.server;
        this.server.db = db;

        this.server.set('automatic 405 routing', true);

        // Expose the post body
        this.server.use(body.json());

        // Assign the app on each request
        this.server.use((req, res, next) => {
            req.app = this.server;
            next();
        });


        // Serve the theme
        this.server.theme = new Theme(config.theme.name, this.server);

        // Setup controllers
        controllers(this, config);

        // Handle errors
        this.server.use(errors());

        this.server.use((req, res, next) => {
            if (res.text || res.data) {
                const returning = {
                    statusCode: res.statusCode
                };
                if (res.text) returning.message = res.text;
                if (res.data) returning.data = res.data;

                res.send(returning);
                return;
            }
            next()
        });
    }

    run() {
        this.server.listen(this.config.port);
    }

};
