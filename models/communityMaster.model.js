const mongoose = require('mongoose')
const communitySchema = new mongoose.Schema({

    community: {
        type: String,
        trim: true,
        required: false,
    },
    parent_community: {
        type: String,
        trim: true,
        required: false,
    },
    religion: {
        type: String,
        trim: true,
        required: false,
    },
    script: {
        type: String,
        trim: true,
        required: false,
    },
    wiki: {
        type: String,
        trim: true,
        required: false,
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('communityMaster', communitySchema)