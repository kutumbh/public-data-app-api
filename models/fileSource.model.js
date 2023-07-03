const mongoose = require('mongoose')
const fileSourceSchema = new mongoose.Schema({
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'file'
    },
    fileName: {
        type: String,
        trim: true,
        required: true,
    },
    fileSource: {
        type: String,
        trim: true,
        required: true
    },
    language: {
        type: String,
        trim: true,
        required: true
    },
    fileType: {
        type: String,
        trim: true,
        required: true
    },
    category: {
        type: String,
        trim: true,
        required: true
    },
    downloadUrl: {
        type: String,
        required: false
    },
    fileNameConvention: {
        type: String,
        required: false,
        default: null
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('fileSource', fileSourceSchema)