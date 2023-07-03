const mongoose = require('mongoose')
const Schema = mongoose.Schema
const assetSchema = new Schema({
    assetSource: { type: String, trim: true},
    remark: { type: String, trim: true},
    assetName: { type: String, trim: true},
    assetType: { type: String, trim: true, required: true},
    fileType: { type: String, trim: true, required: true},
    renditionType: { type: String, trim: true, required: false},
    size: { type: Number, required: false},
    assetPath: { type: String, trim: true, required: true},  
    url: { type: String },
    tagNames:[{
        type: String,
        trim: true,
    }], 
    renditionPaths:[{
        type: String,
        trim: true,
    }], 
    personNames:[{
        type: String,
        trim: true,
    }], 
    createdByUser:{type: String, trim: true }      
   //  tags:     [{ type: mongoose.Types.ObjectId, ref: 'tag' }],
    // height​: { type: Number, required: false},
   // width: { type: Number, required: false},
        
},{ timestamps: true });

assetSchema.index({ assetSource:'text', remark: 'text', assetName: 'text', tagNames:'text', personNames:'text' });

module.exports = new mongoose.model('asset', assetSchema);
