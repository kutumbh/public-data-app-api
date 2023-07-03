const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tagSchema = new Schema({
    tagName:       { type: String, trim: true, required: true },
    tagGroupName:       { type: String, trim: true },
    assets:   [{ type: mongoose.Types.ObjectId, ref: 'asset' }],   
},{ timestamps: true });
module.exports = new mongoose.model('tag', tagSchema);

