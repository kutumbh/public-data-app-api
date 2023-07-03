const mongoose = require('mongoose')
const surnameTypeSchema = new mongoose.Schema({
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
module.exports = mongoose.model('surnameType', surnameTypeSchema)
