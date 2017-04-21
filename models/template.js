const mongoose = require('mongoose');

const schema = mongoose.Schema({
    name: {type: String, unique: true},
    template: String
});
module.exports = mongoose.model('template', schema);
