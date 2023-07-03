const namesModel = require('../models/name.model');
const surnamesModel = require('../models/surname.model');
const filesModel = require('../models/reposFiles.model');
const personsModel = require('../models/reposPersons.model');
const ObjectsToCsv = require('objects-to-csv');
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const mime = require('mime')
const mongoose = require('mongoose')
const ITEM_PER_PAGE = 10;
const _ = require('lodash');
require("dotenv").config();
const s3 = new aws.S3()
// create a Name
exports.createNames = async ({ body }, res) => {
    try {
        // const name = new namesModel(body)
        const name = await namesModel.findOne({ name: body.Name });
        console.log(name)
        if (name) {
            res.status(404).send({
                message: 'Data Already Present, Please Update Translation field!'
            })
        } else {
            const name = new namesModel(body)
            if (name) {
                await name.save()
                res.status(201).send(name)
            }
            else {
                res.status(404).send({
                    message: 'Data found!'
                })
            }
        }

    } catch (e) {
        res.status(400).send(e)
    }
}

//api to get all Names
// exports.getAllNames = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page);
//         const limit = parseInt(req.query.limit)
//         const offset = page ? page * limit : 0;
//         const id = req.body.id;
//         const where = getSearchParams(req.query);
//         console.log('where:', where)
//         const name = await namesModel.find(where)
//             .sort({ name: 1 })
//         // .skip(offset) // Always apply 'skip' before 'limit'
//         // .limit(limit)
//         // .select("-__v"); // This is your 'page size'
//         // console.log(Name)
//         if (name) {
//             // let numOfNames = await NamesDataMode l.countDocuments();
//             const result = name.filter((n, i) => {
//                 let data = n
//                 data.translations = n.translations.filter(t => {
//                     if (t.lang === req.query.language)
//                         return t
//                 })
//                 return data;
//             })

//             // res.status(200).json({
//             //     "message": "Paginating is completed! parameters: page = " + page + ", limit = " + limit,
//             //     "totalPages": Math.ceil(numOfNames / limit),
//             //     "totalItems": numOfNames,
//             //     "maxRowlimit": limit,
//             //     "currentPageSize": Name.length,
//             //     "results": result
//             // });
//             res.status(200).send(name)
//         } else {
//             res.status(404).send({ message: 'No Data found' })
//         }

//     } catch (error) {
//         res.status(500).send({
//             message: "Error -> Can NOT complete a paging + filtering + sorting request!",
//             error: error.message,
//         });
//     }
// }

const getSearchParams = (query) => {
    let where = {}
    console.log('query:', query)
    let name = new RegExp(query.Name, "i");
    // if status is done
    if (query.status == 'Done') {
        where = {
            'name': { '$regex': name },
            'translations.lang': query.language
        }
    }
    // if status is pending
    if (query.status == 'Pending') {
        where = {
            'name': { '$regex': name },
            'translations.lang': { $ne: query.language }
        }
    }
    // if status is all 
    if (query.status == 'All') {
        where = {
            'name': { '$regex': name }
        }
    }
    return where;
}

// ////////////////   API For Update Translations field /////////////////////
exports.updateNames = async ({ params, body }, res) => {
    try {
        const _id = params._id;
        const language = body.language;
        const value = body.value;
        let updateNames;
        // const updateNames = await namesModel.update({ _id: _id }, { $set: { translations:[{lang:language,value:value}] } })
        const names = await namesModel.findOne({ _id: _id, 'translations.lang': language });
        console.log("names:", names)
        if (names) {
            updateNames = await namesModel.update({ _id: _id, 'translations.lang': language }, {
                $set: {
                    "translations.$.value": value
                }
            })
        } else {
            updateNames = await namesModel.update({
                _id: _id,
                translations: {
                    "$not": {
                        "$elemMatch": {
                            "lang": language
                        }
                    }
                }
            }, {
                $addToSet: {
                    translations: { lang: language, value: value }
                }
            })
        }
        if (updateNames) {
            res.status(200).send({ "message": "Translations Updated!", updateNames });
        } else {
            res.status(404).send({
                message: 'Data found!'
            })
        }
    } catch (e) {
        res.status(400).json(e.message)
    }
}

exports.updateNameForm = async ({ params, body }, res) => {
    try {
        console.log('---' + body)
        const _id = params._id;
        console.log("id:" + _id)
        const updateNameData = await namesModel.findByIdAndUpdate({ _id: _id }, body, { new: true })
        if (updateNameData) {
            res.status(201).send(updateNameData)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.deleteName = async (req, res) => {
    try {
        const _id = req.params._id;
        console.log("Delete Names id", _id)
        const names = await namesModel.remove({ _id: _id })
        if (names) {
            res.status(201).send({ "message": "Name Deleted Successfully", names })
        } else {
            res.status(404).send({
                message: 'Data not found!'
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}


exports.createMultiplenames = async (req, res) => {
    // const names = await insertMany([names]);
    const createdBy = req.params.userId;
    // console.log("createdBy:", createdBy)
    let names = req.body.names;
    let surnames = req.body.surnames;

    names = names.map(e => { return ({ name: e.name.toUpperCase(), gender: e.gender, createdBy: createdBy }) })
    surnames = surnames.map(e => { return ({ surname: e.surname.toUpperCase(), createdBy: createdBy }) })
    console.log(names);
    try {
        const nameResult = await namesModel.insertMany(names);
        const surnameResult = await surnamesModel.insertMany(surnames);
        if (nameResult || surnameResult) {
            console.log("nameResult:", nameResult, "surnameResult:", surnameResult)
            res.status(200).send({ "message": "Names and surnames inserted successfully" })
        } else {
            res.status(404).send({
                message: 'Data Already Present'
            })
        }
    } catch (e) {
        res.status(409).send(e.toString());
    }
}

exports.getAllNamesDownload = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit)
        const offset = page ? page * limit : 0;
        const id = req.body.id;
        let fromDate = req.body.fromDate;
        let toDate = req.body.toDate;
        const where = getSearchParams(req.query);
        console.log('where:', where)
        const nameData = await namesModel.find().sort({ name: 1 })
        // console.log(nameData)
        let filterArray = [];
        _.forEach(nameData, async function (value) {
            let filterData = {}
            filterData.name = value.name;
            filterData.gender = value.gender;
            filterData.meaning = value.meaning;
            filterArray.push(filterData)
        })
        const csv = new ObjectsToCsv(filterArray);
        // Return the CSV file as string:
        res.status(200).send(csv)
        // console.log(await csv.toString());

    } catch (error) {
        res.status(500).send({
            message: "Error -> Can NOT complete a paging + filtering + sorting request!",
            error: error.message,
        });
    }
}

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'
        || file.mimetype === 'text/csv' || file.mimetype === "application/vnd.ms-excel") {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type, upload valid file only!'), false)
    }
}
function getSignedUrl(data) {
    try {
        console.log("data", data)
        var key = data.replace('https://dev-kutumbh-masters.s3.ap-south-1.amazonaws.com/', '')
        // key = key.replace('/', '')
        console.log("key", key)
        var url = s3.getSignedUrl("getObject", {
            Bucket: 'dev-kutumbh-masters',
            Key: key,
            Expires: 604800 // Expire 7 days   //on 
        })
        return url
    } catch (e) {
        console.log("Error", e.toString())
        return e
    }
}
exports.nameAndsurnamesUploads = async (req, res) => {
    try {
        const { section = 'general' } = req.query
        const upload = multer({
            fileFilter,
            storage: multerS3({
                contentType: multerS3.AUTO_CONTENT_TYPE,
                s3,
                contentLength: 50000000, //50 MB file size
                bucket: //process.env.BUCKET_NAME,
                    function (req, file, cb) {
                        const queryParams = req.query;
                        if (queryParams.main_Option == "newMasters") {
                            let bucketName = queryParams.fileName === 'names' ? 'newMasterNames' : 'newMasterSurnames'
                            var bktName = process.env.AWS_BUCKET_NAME_MASTER + "/" + bucketName;
                        } else if (queryParams.main_Option == "translitration") {
                            var bktName = process.env.AWS_BUCKET_NAME_MASTER + "/" + "translitration" + "/" + queryParams.fileName
                        }
                        console.log("bktName", process.env.AWS_BUCKET_NAME_MASTER);
                        cb(null, bktName)
                    },
                metadata(req, file, cb) {
                    cb(null, { fieldName: file.fieldname })
                },
                key(req, file, cb) {
                    const filename = Date.now().toString() + '_' + file.originalname //+ '.' + mime.getExtension(file.mimetype);
                    cb(null, filename)
                }
            })
        })
        const singleUpload = upload.single('file')
        singleUpload(req, res, async (err) => {
            try {
                if (err) {
                    return res.status(422).send({
                        errors: [{ title: 'Media Upload Error', detail: err.message }]
                    })
                }
                if (req.file && req.file.location) {
                    var key = req.file.key.split('.').slice(0, -1).join('.')
                    console.log("req.file", req.file)
                    return res.json({ fileUrl: getSignedUrl(req.file.location), key: key })
                } else {
                    return res.status(422).send('Error')
                }
            } catch (e) {
                res.status(400).send(e)
            }
        })
    } catch (e) {
        res.status(400).send(e)
    }
}


//*****************api to get all Names******************

exports.getAllNames = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit)
        const offset = page ? page * limit : 0;
        const id = req.body.id;
        const where = getSearchParamss(req.query);
        console.log('where:', where)
        const name = await namesModel.find(where)

            .sort({ name: 1 })
        // .skip(offset) // Always apply 'skip' before 'limit'
        // .limit(limit)
        // .select("-__v"); // This is your 'page size'
        // console.log(Name)
        if (name) {
            // let numOfNames = await NamesDataMode l.countDocuments();
            const result = name.filter((n, i) => {
                let data = n
                data.translations = n.translations.filter(t => {
                    if (t.lang === req.query.language) s
                    return t
                })
                return data;
            })

            // res.status(200).json({
            //     "message": "Paginating is completed! parameters: page = " + page + ", limit = " + limit,
            //     "totalPages": Math.ceil(numOfNames / limit),
            //     "totalItems": numOfNames,
            //     "maxRowlimit": limit,
            //     "currentPageSize": Name.length,
            //     "results": result
            // });
            res.status(200).send(name)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }

    } catch (error) {
        res.status(500).send({
            message: "Error -> Can NOT complete a paging + filtering + sorting request!",
            error: error.message,
        });
    }
}

const getSearchParamss = (query) => {
    let where = {}
    console.log('query:', query)
    let name = new RegExp(query.Name, "i")


    let range = query.range ? query.range : null;
    // let range1 = query.range.toUpperCase() ;
    console.log(range);


    // if status is done
    if (query.status == 'Done' && name != null) {
        where = {
            'name': { '$regex': name },
            'translations.lang': query.language
        }
    }
    // if status is pending 
    if (query.status == 'Pending' && name != null) {
        where = {
            'name': { '$regex': name },
            'translations.lang': { $ne: query.language }
        }
    }
    // if status is all 
    if (query.status == 'All' && name != null) {
        where = {

            'name': { '$regex': name }
        }
    }



    if (query.status == 'Done' && range != null) {
        where = {
            'name': { '$regex': ("^[" + [range] + "]") },
            'translations.lang': query.language
        }
    }
    // if status is pending 



    if (query.status == 'Pending' && range != null) {
        where = {
            'name': { '$regex': ("^[" + [range] + "]") },
            'translations.lang': { $ne: query.language }
        }
    }
    // if status is all 
    if (query.status == 'All' && range != null) {

        where = {
            // 'name': { '$regex': '^[A-D a-d]'},
            'name': { '$regex': ("^[" + [range] + "]") }
        }
    }


    return where;
}


exports.changeTranslietrationNameAndSurname = async (req, res) => {
    try {
        let startDate = req.body.startDate;
        let endDate = req.body.endDate;
        let downloadNewName = req.body.downloadNewName;
        let language = req.body.language;
        let NamesArray = [];
        if (downloadNewName === "DNN") {
            NamesArray = await downloadRegionalName(
                downloadNewName,
                language,
                startDate,
                endDate
            );
        }
         else if (downloadNewName === "DNS") {
            NamesArray = await downloadRegionalSurname(
                downloadNewName,
                language,
                startDate,
                endDate
            );
        }
        if (NamesArray) {
            res.status(200).send({
                result: NamesArray,
            });
        } else {
            res.status(200).send({
                "Data valid": "download data",
            });
        }
    } catch (e) {
        console.log(e);
        res.status(400).send(e.toString());
    }
};

async function downloadRegionalName(downloadNewName, language, startDate, endDate){
    if (!_.isEmpty(downloadNewName)) {
        var downloadRegionalName = await filesModel.aggregate([   
                    { $match:{ 
                        "language":language
                    }   
                  },         
                          {
                              $lookup:{
                                  from: "persons",       // person table name
                                  localField: "_id",   // name of files table field
                                  foreignField: "fileId", // name of files table field
                                  as: "inventory_data"         // alias for person table
                              }
                          },
                            {   $unwind:"$inventory_data" },
                                {$match:{ $and:[{  "inventory_data.createdAt": {
                                    $gte: new Date(startDate),
                                    $lte: new Date(endDate)
                       } },{'inventory_data.name':{ $ne: null }}]       
                    }  
                  }, 
                     {   
                      $project:{
                          "inventory_data.fileId":1,
                          "inventory_data.name":1,
                          "inventory_data.regionalName":1,
                          "inventory_data.sex":1
                      } 
                  } ])
        }
        return downloadRegionalName;
  }

  async function downloadRegionalSurname(downloadNewName, language, startDate, endDate){
    if (!_.isEmpty(downloadNewName)) {
        var downloadRegionalSurname = await filesModel.aggregate([   
                    { $match:{ 
                        "language":language
                    }   
                  },         
                          {
                              $lookup:{
                                  from: "persons",       // person table name
                                  localField: "_id",   // name of files table field
                                  foreignField: "fileId", // name of files table field
                                  as: "inventory_data"         // alias for person table
                              }
                          },
                            {   $unwind:"$inventory_data" },
                                {$match:{ $and:[{  "inventory_data.createdAt": {
                                    $gte: new Date(startDate),
                                    $lte: new Date(endDate)
                       } },{'inventory_data.lastName':{ $ne: null }}]       
                    }  
                  }, 
                     {   
                      $project:{
                          "inventory_data.fileId":1,
                          "inventory_data.lastName":1,
                          "inventory_data.regionalLastName":1,
                      } 
                  } ])
        }
        return downloadRegionalSurname;
  }

