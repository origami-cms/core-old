const co = require('co');
const fs = require('co-fs-extra');
const admin = require('origami-admin');


require('./lib/console');

const Database = require('./database');
const Server = require('./server');

const config = require('./lib/config');


module.exports = class Origami {
    constructor() {
        const self = this;
        self.config = config;
        self.Database = new Database(self.config);

        if (self.config.server.secret);

        co(function *() {
            yield self.Database.connect();
            self.server = new Server(self.config, self.Database.db);
            self.server.run();
            self.admin = admin(self);
        }).catch(err => {
            console.error(err);
        });
    }
};
