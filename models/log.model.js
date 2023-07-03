const mongoose = require("mongoose");
const logSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      trim: true,
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    main_Option: {
      type: String,
      trim: true,
      required: false,
    },
    sub_Option: {
      type: String,
      trim: true,
      required: false,
    },
    parameter: {
      startDate: Date,
      endDate: Date,
      language: String,
      range: String,
    },
    status: {
      type: String,
      trim: true,
      required: false,
    },
    newCount:{
        type: Number,
        trim: true,
    },
    updatedCount:{
        type: Number,
        trim: true,
    },
    noActionsStatus:{
        type: String,
        trim: true,
    },
    fileName:{
        type:String,
        trim: true,
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("log", logSchema);
