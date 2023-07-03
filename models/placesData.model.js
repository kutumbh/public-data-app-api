const mongoose = require('mongoose')
const placesDataSchema = new mongoose.Schema({
    parentID: {
        type: String,
        trim: true,
        default: null,
    },
    categoryName: {
        type: String,
        trim: true,
        required: true
    },
    categoryCode: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    categoryType: {
        type: String,
        trim: true,
    },
    sortOrder: {
        type: String,
        trim: true,
        required: true
    },
    value1: {
        type: String,
        trim: true,
        required: false
    },
}, {
    timestamps: true
})
module.exports = mongoose.model('placesData', placesDataSchema)