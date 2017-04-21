const express = require('express');
const route = require('../../server/middleware/route');
const auth = require('../../server/middleware/auth');

module.exports = router => {
    const admin = express.Router();
    admin.use(auth);

    route('/', admin)
        .get((req, res) => {
            res.json({
                pages: [
                    {name: 'Dashboard', url: '/'},
                    {name: 'Pages', url: '/pages'},
                    {name: 'Templates', url: '/templates'},
                    {name: 'Assets', url: '/assets'},
                    {name: 'Theme', url: '/theme'},
                    {name: 'Settings', url: '/settings'}
                ]
            });
        });

    router.use('/admin', admin);
};
