const logModel = require('../models/log.model')
const fileSourceModel = require('../models/fileSource.model');
const _ = require('lodash');

exports.createLog = async ({ body }, res) => {
    console.log(body)
    try {
        const log = new logModel(body)
        console.log("--",log)
        if (log) {
            log.newCount = null,
            log.updatedCount = null,
            await log.save()
            console.log(" line 15",log)
            res.status(201).send(log)
        } else {
            res.status(404).send({
                message: 'Data found!'
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.getLog = async (req, res) => {
    try {
        // var id = req.params.pId;
        const log = await logModel.find({}).populate({
            path: 'user',
            model: 'user',
            select: 'fname lname'
        }).sort({ date: -1 });
        if (log) {
            res.status(201).send(log)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.logsFilter = async (req, res) => {
    try {
        let main_Option = req.body.main_Option;
        let sub_Option = req.body.sub_Option;
        let startDate = req.body.startDate;
        let endDate = req.body.endDate;
        if (!_.isEmpty(main_Option) && !_.isEmpty(sub_Option) && _.isEmpty(startDate) && (sub_Option === "Upload New Names" || sub_Option === "Upload New Surnames")) {

            const log = await logModel.aggregate([
                //   { "$match": { "fileName":"$fileName"}},
                  { "$lookup": {
                    "from": "logs",
                    "localField": "fileName",
                    "foreignField": "fileName",
                    "as": "fileData"
                  }},
                  {$unwind:"$fileData"},
                  {$match:{"newCount":{$ne:null},"fileData.user":{$ne:null},"sub_Option":sub_Option,
                  "main_Option":main_Option
                  }
                  },
                  { "$lookup": {
                    "from": "users",
                    "localField": "fileData.user",
                    "foreignField": "_id",
                    "as": "user"
                  }},
                  {$unwind:"$user"},{$unwind:"$fileData"},
                    {$project:{
                        "user": 1,
                        "fileName":1,
                        "newCount":1,
                        "updatedCount":1,
                //         "fileData.user":1,
                        "main_Option" :1,
                        "sub_Option" : 1,
                        "date" : 1,
                        "createdAt" : 1,
                        "updatedAt" : 1,
                        "fname":1,
                        "lname":1,
                        "fileData.parameter":1,
                        
                        }}
                  
                ])
            res.status(200).send(log);
        }else if (!_.isEmpty(main_Option) && !_.isEmpty(sub_Option) && !_.isEmpty(startDate)&& (sub_Option === "Upload New Names" || sub_Option === "Upload New Surnames")) {

            const log = await logModel.aggregate([
                //   { "$match": { "fileName":"$fileName"}},
                  { "$lookup": {
                    "from": "logs",
                    "localField": "fileName",
                    "foreignField": "fileName",
                    "as": "fileData"
                  }},
                  {$unwind:"$fileData"},
                  {$match:{"newCount":{$ne:null},"fileData.user":{$ne:null},"sub_Option":sub_Option,
                  "main_Option":main_Option,"date": {
                                        $gte: new Date(startDate),
                                        $lte: new Date(endDate)
                                     }
                  }
                  },
                  { "$lookup": {
                    "from": "users",
                    "localField": "fileData.user",
                    "foreignField": "_id",
                    "as": "user"
                  }},
                  {$unwind:"$user"},{$unwind:"$fileData"},
                    {$project:{
                        "user": 1,
                        "fileName":1,
                        "newCount":1,
                        "updatedCount":1,
                //         "fileData.user":1,
                        "main_Option" :1,
                        "sub_Option" : 1,
                        "date" : 1,
                        "createdAt" : 1,
                        "updatedAt" : 1,
                        "fname":1,
                        "lname":1,
                        "fileData.parameter":1,
                        
                        }}
                  
                ]).sort({ date: -1 })
            res.status(200).send(log);
        }else if (!_.isEmpty(main_Option) && !_.isEmpty(sub_Option) && _.isEmpty(startDate)&& (sub_Option === "Download New Names" || sub_Option === "Download New Surnames")) {

            const log = await logModel.aggregate([
                {$match:{"sub_Option":sub_Option,"main_Option":main_Option}
                },
                { "$lookup": {
                  "from": "users",
                  "localField": "user",
                  "foreignField": "_id",
                  "as": "user"
                }},
                {$unwind:"$user"},
                  {$project:{
                      "user": 1,
//                         "fileName":1,
//                         "newCount":1,
//                         "updatedCount":1,
              //         "fileData.user":1,
                      "main_Option" :1,
                      "sub_Option" : 1,
                      "date" : 1,
                      "createdAt" : 1,
                      "updatedAt" : 1,
                      "fname":1,
                      "lname":1,
                      "parameter":1,
                      
                      }}
//                   
              ]).sort({ date: -1 })
            res.status(200).send(log);
        }else if (!_.isEmpty(main_Option) && !_.isEmpty(sub_Option) && !_.isEmpty(startDate)&& (sub_Option === "Download New Names" || sub_Option === "Download New Surnames")) {

            const log = await logModel.aggregate([
                {$match:{"sub_Option":sub_Option,"main_Option":main_Option,"date": {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                 }}
                },
                { "$lookup": {
                  "from": "users",
                  "localField": "user",
                  "foreignField": "_id",
                  "as": "user"
                }},
                {$unwind:"$user"},
                  {$project:{
                      "user": 1,
//                         "fileName":1,
//                         "newCount":1,
//                         "updatedCount":1,
              //         "fileData.user":1,
                      "main_Option" :1,
                      "sub_Option" : 1,
                      "date" : 1,
                      "createdAt" : 1,
                      "updatedAt" : 1,
                      "fname":1,
                      "lname":1,
                      "parameter":1,
                      
                      }}
//                   
              ]).sort({ date: -1 })
            res.status(200).send(log);
        }
        }catch (e) {
                    res.status(400).send(e)
                }
            }
//         if (!_.isEmpty(main_Option) && !_.isEmpty(sub_Option)) {

//             const log = await logModel.find({
//                 "main_Option": main_Option,
//                 "sub_Option": sub_Option,
//                 date: {
//                     $gte: new Date(startDate),
//                     $lte: new Date(endDate)
//                 },
//             }).populate({
//                     path: 'user',
//                     model: 'user',
//                     select: 'fname lname'
//                 }).sort({ date: -1 })

//             //     const log = await logModel.aggregate([
//             //         {
//             //             $match: { date: {
//             //                        $gte: new Date(startDate),
//             //                       $lte: new Date(endDate)
//             //                   },
//             //                "main_Option": main_Option,
//             //                "sub_Option": sub_Option
//             //             }
//             //         },
//             // ]).sort({date:-1})
//             res.status(200).send(log);
//         }
//     } catch (e) {
//         res.status(400).send(e)
//     }
// }



// exports.logsFilter = async (req, res) => {
//     try {
//         let main_Option = req.body.main_Option;
//         let sub_Option = req.body.sub_Option;
//         let startDate = req.body.startDate;
//         let endDate = req.body.endDate;
//         if (!_.isEmpty(main_Option) && _.isEmpty(sub_Option)) {

//             const log = await logModel.find({
//                 "main_Option": main_Option,
//             }).populate({
//                     path: 'user',
//                     model: 'user',
//                     select: 'fname lname'
//                 }).sort({ date: -1 })
//             // const log = await logModel.aggregate([
//             //     {
//             //         $match: {
//             //            "main_Option": main_Option,
//             //         }
//             //     },
//             // ]).sort({date:-1})
//             res.status(200).send(log);
//         }
//         if (!_.isEmpty(main_Option) && !_.isEmpty(sub_Option)) {

//             const log = await logModel.find({
//                 "main_Option": main_Option,
//                 "sub_Option": sub_Option,
//                 date: {
//                     $gte: new Date(startDate),
//                     $lte: new Date(endDate)
//                 },
//             }).populate({
//                     path: 'user',
//                     model: 'user',
//                     select: 'fname lname'
//                 }).sort({ date: -1 })

//             //     const log = await logModel.aggregate([
//             //         {
//             //             $match: { date: {
//             //                        $gte: new Date(startDate),
//             //                       $lte: new Date(endDate)
//             //                   },
//             //                "main_Option": main_Option,
//             //                "sub_Option": sub_Option
//             //             }
//             //         },
//             // ]).sort({date:-1})
//             res.status(200).send(log);
//         }
//     } catch (e) {
//         res.status(400).send(e)
//     }
// }
