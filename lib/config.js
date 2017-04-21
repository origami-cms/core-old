const fs = require('fs');
const path = require('path');

// Read the origami.json in the Site root directory

const err = new Error('oragami.json could not be located');
const configPath = path.join(process.cwd(), 'origami.json');
let stats = null;

try {
    stats = fs.statSync(configPath);
} catch (e) {
    throw err;
}
if (!stats.isFile()) throw err;

const config = require(configPath);
config.uploads = path.resolve(process.cwd(), './uploads');

config.secret = fs.readFileSync(config.server.secret).toString().trim();


module.exports = config;
