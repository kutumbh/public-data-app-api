const mongoose = require('mongoose')
const surnameDataSchema = new mongoose.Schema(
  {
      surname: {
      type: String,
      trim: true,
      required: true
    },
      meaning: {
      type: String,
      trim: true,
      required: true,
    },
      source: {
      type: String,
      trim: true,
      required: true
    },
      origin: {
        type: String,
        trim: true,
      //required: true
    },
      religion: {
      type: String,
      trim: true,
      required: true
      },
     
      community:{
      type: String,
      trim: true,
      required: true,
    },
      subcommunity:{
        type: String,
        trim: true,
        required: true,
      },
      gotra:{
        type: String,
        trim: true,
        required: true,
      },
      kuldevtaFamilyDeity:{
        type: String,
        trim: true,
        required: true,
      },
      translations: [{ lang: String,value: String }],  
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('surnameData', surnameDataSchema)
