const path = require('path');
const co = require('co');
const pug = require('pug');
const recursive = require('recursive-readdir');
const express = require('express');


module.exports = class Theme {
    constructor(name, app) {
        this.name = name;

        this.settings = require(this.directory);
        const router = express.Router();
        ['/images', '/css', '/fonts'].forEach(f => {
            app.use(f, express.static(path.join(this.directory, f)));
        });
    }

    // ------------------------------------------------------- Public properties
    // Theme directory
    get directory() { return path.resolve(process.cwd(), 'themes', this.name); }


    // ---------------------------------------------------------- Public methods
    pages() {
        return this._recurse('pages');
    }
    *templates() {
        const self = this;

        const templates = {};
        const files = yield self._recurse('templates');

        files.forEach(f => {
            const ext = path.extname(f);
            templates[path.basename(f, ext)] = {
                type: ext.slice(1),
                file: f
            };
        });

        return templates;
    }

    *render(theme, data) {
        const templates = yield this.templates();
        const template = templates[theme];
        if (!template) return false;

        data.site = {
            title: 'One True Design',
            images: {
                'path': '/images/',
                'logo': {
                    path: 'logo.svg',
                    alt: 'One True Design'
                }
            }
        };
        Object.assign(data.page, {
            highlight: 'vuid-blue',
            shade: 'white'
        });

        return pug.renderFile(template.file, data);
    }


    _recurse(dir) {
        return new Promise((res, rej) => {
            recursive(path.join(this.directory, dir), (err, files) => {
                if (err) return rej(err);
                else return res(files);
            });
        });
    }
};
