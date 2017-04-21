/* eslint-disable new-cap */

const express = require('express');
const Boom = require('Boom');
const archiver = require('archiver');
const path = require('path');
const fs = require('co-fs');
const wrap = require('co-express');
const recursive = require('recursive-readdir');
const multer = require('multer');

const route = require('../../server/middleware/route');
const auth = require('../../server/middleware/auth');

// NPM junk
const blacklist = [
    // # All
    'npm-debug.log', // Error log for npm
    '*.swp', // Swap file for vim state
    // # macOS
    '.DS_Store', // Stores custom folder attributes
    '.AppleDouble', // Stores additional file resources
    '.LSOverride', // Contains the absolute path to the app to be used
    'Icon', // Custom Finder icon: http://superuser.com/questions/298785/icon-file-on-os-x-desktop
    '.Trashes', // File that might appear on external disk
    '__MACOSX', // Resource fork
    // # Windows
    'Thumbs.db', // Image file cache
    'ehthumbs.db', // Folder config file
    'Desktop.ini', // Stores custom folder attributes
    '@eaDir' // Synology Diskstation 'hidden' folder where the server stores thumbnails
];


module.exports = (router, uploads) => {


    const storage = multer.diskStorage({
        destination(req, file, cb) {
            const p = path.join(uploads, req.url);
            cb(null, path.dirname(p));
        },
        filename(req, file, cb) {
            const p = path.join(uploads, req.url);
            cb(null, path.basename(p));
        }
    });
    const upload = multer(
        {storage}
    ).single('file');


    const uploadsRouter = express.Router();
    uploadsRouter.use(auth);

    // Return all the uploads into a json file tree
    route('/', uploadsRouter)
        .get((req, res) => {
            const root = {
                children: [],
                path: '/'
            };

            // Retrieve an item from a parent
            const getDir = (dir, parent) => parent.children.filter(
                c => c.name == dir
            );

            // Create a nested folder path in root if it doesn't exist
            const checkPath = (split, parent = root) => {
                const dir = getDir(split[0], parent);
                if (!dir.length) {
                    parent.children.push({
                        name: split[0],
                        type: 'dir',
                        children: [],
                        path: `${parent.path}${split[0]}/`
                    });

                    return getDir(split[0], parent)[0];
                } else return dir[0];
            };

            const parse = file => {
                const relative = path.relative(uploads, file);
                const p = path.dirname(relative);
                const dir = p != '.' ? checkPath(p.split('/')) : root;

                dir.children.push({
                    name: path.basename(file),
                    type: 'file',
                    ext: path.extname(file).slice(1),
                    path: `/${relative}`
                });
            };

            recursive(uploads, blacklist, (err, files) => {
                files.forEach(parse);
                res.send(root);
            });

        });


    route('/*', uploadsRouter)
        // Download a file or zip a directory
        .get(wrap(function *get(req, res) {
            const p = path.join(uploads, req.url);
            let stats;
            try {
                stats = yield fs.stat(p);
            } catch (e) {
                throw new Boom.notFound('Could not find resource');
            }

            // Zip a directory
            if (stats.isDirectory()) {
                const archive = archiver('zip');
                archive.on('error', err => {
                    const code = 500;
                    throw new Boom.wrap(err, code);
                });

                const name = p.split('/')
                .filter(dir => dir)
                .pop();

                archive.pipe(res);
                archive.directory(p, name);
                archive.finalize();

                // Send a file
            } else if (stats.isFile()) {
                res.attachment(p);
                res.sendFile(p);
            }
        }))

        .post(wrap(function *post(req, res, next) {
            const p = path.join(uploads, req.url);
            const relative = path.relative(uploads, p);
            const name = path.basename(req.url);
            const ext = path.extname(name);
            /* eslint-disable no-empty */
            let stats;
            try {
                stats = yield fs.stat(p);
            } catch (e) {}
            if (stats) throw new Boom.conflict('Resource already exists');


            yield upload(req, res, () => {
                res.text = 'Sucessfully uploaded file';
                res.data = {
                    name,
                    ext,
                    type: 'file',
                    path: relative
                };
                next();
            });

        }));

    router.use('/uploads', uploadsRouter);
};
