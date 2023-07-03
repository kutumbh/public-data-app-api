const mongoose = require('mongoose')
const imageSchema = new mongoose.Schema(
  {
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'image'
      },
    fileName: {
      type: String,
      trim: true,
      required: true,
    },
    key: {
      type: String,
      trim: true,
      required: true
    },
    p_id: {
      type: String,
      trim: true,
      required: true
    },
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('image', imageSchema)
