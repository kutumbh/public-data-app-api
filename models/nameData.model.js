const mongoose = require('mongoose')
const nameDataSchema = new mongoose.Schema(
  {
      name: {
      type: String,
      trim: true,
      required: true
    },
      meaning: {
      type: String,
      trim: true,
      required: true,
    },
      gender: {
      type: String,
      trim: true,
      required: true,
    },
      source: {
      type: String,
      trim: true,
      required: true
    },
     numerology: {
      type: String,
      trim: true,
      required: true
    },
     rashi:{
      type: String,
      trim: true,
      required: true,
    },
    nakshatra:{
        type: String,
        trim: true,
        required: true,
      },
      religion:{
        type: String,
        trim: true,
        required: true,
      },
      equalTo:{
        type: String,
        trim: true,
      },
      translations: [{ lang: String,value: String }],
     },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('nameData', nameDataSchema)
