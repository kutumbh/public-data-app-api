const mongoose = require('mongoose')
const masterDataSchema = new mongoose.Schema(
    {
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
            required: true
        },
        value1: {
            type: String,
            trim: true,
            required: false
        },
         value2: {
            type: String,
            required: false,
            default:null
        },
        url: {
            type: String,
            required: false,
            default:null
        },
        translation: {
            type: String,
            required: false,
            default:null
        },
        sortIndex: {
            type: String,
            required: false,
            default:null
        },
        sortOrder: {
            type: String,
            required: false,
            default:null
        },        
        classification: {
            type: String,
            required: false,
            default:null
        },
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('masterData', masterDataSchema)
