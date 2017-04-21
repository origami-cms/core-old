const mongoose = require('mongoose');
const npm = require('npm-programmatic');
const path = require('path');
const Boom = require('boom');
const fs = require('co-fs-extra');


const modulesDir = path.resolve(process.cwd(), 'node_modules');
const themesDir = path.resolve(process.cwd(), 'themes');


const schema = mongoose.Schema({
    packageName: {type: String, unique: true},
    name: {type: String, unique: true},
    settings: Object,
    activated: {type: Boolean, default: false},
    removed: {type: Boolean, default: false}
});

const model = mongoose.model('theme', schema);
model.automatic = false;


/**
 * Check if a theme is installed and throws errors
 *
 * @param  {String} pkg     NPM package name
 * @param  {Boolean} expect If true, throws error if document doesn't exist,
 *                          otherwise throw error if it does
 * @return {Schema}         Theme instance
 */
const check = function *check(pkg, expect = true) {
    const err = 400;
    const exists = yield model.findOne({packageName: pkg, removed: false});
    if (!exists && expect) throw new Boom.notFound('Theme is not installed');
    if (exists && !expect) throw new Boom.create(err,
        'Theme is already installed'
    );

    return exists;
};


// List the models installed in Origami
model.list = function *list() {
    const themes = yield model.find({removed: false});

    return themes.map(theme => ({
        name: theme.name,
        package: theme.packageName,
        activated: theme.activated
    }));
};


// Install a Origami theme from NPM, store in database, and save to file system
model.install = function *install(theme) {
    let name = `origami-theme-${theme}`;
    let pkg = path.resolve(modulesDir, name);
    const dest = path.resolve(themesDir, theme);

    // If it's local env, install test theme from file system
    if (process.env.NODE_ENV != 'production') {
        name = path.resolve(process.cwd(), '../origami-theme-test');
        pkg = path.resolve(process.cwd(), 'node_modules/origami-theme-test');
    }

    // Check if theme is previously installed
    yield check(`origami-theme-${theme}`, false);

    // Install the NPM package
    try {
        yield npm.install([name], {
            cwd: process.cwd()
        });
    } catch (e) {
        const reg = /npm\sERR!\scode\sE(.+)\n/;
        const [, code] = reg.exec(e.message);

        if (code == '404') throw new Boom.notFound('Theme not found');
    }

    // Move the package to the themes dir
    yield fs.move(pkg, dest);

    // Read config
    let config;
    try {
        config = require(path.resolve(dest, 'theme.json'));
    } catch (e) {
        const err = 500;
        throw new Boom.create(err, 'Theme has no configuration file');
    }

    // Add into database
    try {
        const newTheme = yield model.create({
            name: config.name,
            packageName: config.package,
            settings: {}
        });
        yield model.activate(theme);
        return newTheme;
    } catch (e) { fs.remove(dest); }
};


// Removes a theme from the database, and the file system
model.uninstall = function *uninstall(theme) {
    const pkg = `origami-theme-${theme}`;
    const dest = path.resolve(process.cwd(), 'themes', theme);

    // Check if it's installed
    const exists = yield check(pkg);

    // Remove from DB
    yield exists.remove();
    // Remove from FS
    yield fs.remove(dest);
};


// Sets a theme to active
model.activate = function *activate(theme) {
    console.log('ACTIVATING', theme);
    const pkg = `origami-theme-${theme}`;
    const exists = yield check(pkg);
    exists.activated = true;
    yield exists.save();

    yield model.update({packageName: {$ne: pkg}}, {
        activated: false
    });
};

// Gets the current, activated theme
model.current = function *current() {
    const current = yield model.findOne({
        activated: true,
        removed: false
    });
    const err = 500;
    if (!current) throw new Boom.create(err, 'No theme installed');

    const [, name] = (/^origami-theme-([a-zA-Z\s]+)$/)
        .exec(current.packageName);

    const dir = path.resolve(themesDir, name);
};


module.exports = model;
