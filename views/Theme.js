const path = require('path');
const tree = require('directory-tree');
const pug = require('pug');

module.exports = class Theme {
    constructor(name, app) {
        this.name = name;
        this.app = app;

        this.settings = require(this.directory);

        this.tree = tree(this.directory);
        if (!this.tree) throw new Error(`Could not find theme '${name}'`);

        this._setupRoutes();

        this.data = {
            site: {
                title: 'One True Design'
            },
            images: {
                "path": '/images/',
                'logo': {
                    path: 'logo.svg',
                    alt: 'One True Design'
                }
            }
        };
    }

    // ------------------------------------------------------- Public properties
    get pages() { return this._getFiles(this._dirPages); }

    // Theme directory
    get directory() { return path.resolve(process.cwd(), 'themes', this.name); }


    // ---------------------------------------------------------- Public methods
    render(url, data) {
        const page = this._getPage(url);

        return pug.renderFile(page.path, data);
    }


    // ------------------------------------------------------ Private properties
    // Views directory
    get _dirViews() {
        if (!this.tree) return false;
        else return this._getDir(this.tree, 'views');
    }

    // Pages directory
    get _dirPages() { return this._getDir(this._dirViews, 'pages'); }

    // Templates directory
    get _dirTemplates() { return this._getDir(this._dirViews, 'pages'); }

    // --------------------------------------------------------- Private methods
    // Get child directory
    _getDir(dir, child) {
        if (!dir) return false;
        if (!dir.children) return false;

        return dir.children.find(c => c.name == child);
    }

    // Recursively flatten files in directory
    _getFiles(dir, files = []) {
        dir.children.forEach(f => {
            if (f.children) return this._getFiles(f, files);

            f.url = path.relative(this._dirPages.path, f.path);
            f.url = `/${f.url.slice(0, -1 * f.extension.length)}`;

            files.push(f);
        });

        return files;
    }

    // Find a page via a url
    _getPage(url) {
        return this.pages.find(p => p.url == url);
    }

    _setupRoutes() {
        this.pages.forEach(p => {
            this.app.server.server.route(p.url)
                .get((req, res) => {
                    console.log(this.data);
                    res.send(this.render(p.url, this.data));
                });
        });
    }
};
