const API = require('./api');
const pages = require('./pages');

module.exports = (app, config) => {

    API(app, config);

    pages(app, config);

};
