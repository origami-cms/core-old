const mongoose = require('mongoose');

const reqString = {type: String, required: true}

const schema = mongoose.Schema({
    title: reqString,
    heading: reqString,
    content: reqString,
    language: {
        type: String,
        default: 'txt',
        enum: ['md', 'html', 'txt']
    },
    url: reqString,
    template: Object
}, {
    timestamps: true
});
module.exports = mongoose.model('page', schema);
