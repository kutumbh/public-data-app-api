const mongoose = require('mongoose')
const EntityLogSchema = new mongoose.Schema({

docType:{
    type:String
},

eCode:{
    type:String
},
refURL:{
    type:String
},

comment:{
    type:String
}},

    {
        timestamps: true
    }

)
module.exports = mongoose.model('entityLog', EntityLogSchema,'entityLog')
