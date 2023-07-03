const mongoose = require('mongoose')
const kuldevtaSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: false
      }
    },
    {
        timestamps: true
    }
)
module.exports = mongoose.model('kuldevta', kuldevtaSchema)
