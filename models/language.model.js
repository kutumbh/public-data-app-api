const mongoose = require('mongoose')
const translationLanguage = new mongoose.Schema(
    {
        translation: [{ language: "String", 
        translatedObj: Schema.Types.Mixed }]
    }
)
    
module.exports = mongoose.model('language', translationLanguage)
