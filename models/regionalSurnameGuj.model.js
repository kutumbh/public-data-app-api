const mongoose = require('mongoose')
const regionalSurnameGujSchema = new mongoose.Schema({
    originName: {
        type: String,
        trim: true,
        required: false
      },
    regionalName: {
        type: String,
        trim: true,
        required: false
      },
      lastName: {
        type: String,
        trim: true,
        required: false
      },
      regionalLastName: {
        type: String,
        trim: true,
        required: false
      },
      fileId: {
        type: String,
        trim: true,
        required: false
      },
      regionalSurnameData: {
        type: String,
        trim: true,
        required: false
      }
},
    {
        timestamps: true
    }
)
module.exports = mongoose.model('regionalSurnameGuj', regionalSurnameGujSchema)