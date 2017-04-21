const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

module.exports = class Database {
    constructor(config) {
        this.settings = Object.assign({}, config.database);
        this.modelsDir = path.resolve(__dirname, '../models/');
    }

    get url() {
        return `mongodb://${this.settings.url}:${this.settings.port}/${this.settings.db}`;
    }

    *connect() {
        try {
            // HACK: Fixes https://github.com/Automattic/mongoose/issues/4291
            mongoose.Promise = global.Promise;
            this.db = yield mongoose.connect(this.url);
            console.success('Connected successfully to database');
        } catch (e) {
            console.error('Could not connect to database');
            process.exit();
        }


        this._loadModels(this.modelsDir);
    }
    close() {
        if (!this.db) return false;
        this.db.close();
        this.db = null;
    }


    _loadModels(dir) {
        fs.readdirSync(dir).forEach(file => {
            if (file.includes('.js')) require(
                path.resolve(this.modelsDir, file)
            );
        });
    }
};
