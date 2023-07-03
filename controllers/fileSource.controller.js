const fileSourceModel = require('../models/fileSource.model');
const userModel = require('../models/user.model');
const mongoose = require('mongoose')

exports.createFileSource = async ({ body }, res) => {
    try {
        // Create a fileSource
        const fileSource = await fileSourceModel.find({
            fileName: body.fileName,
            fileSource: body.fileSource,
            language: body.language,
            fileType: body.fileType
        })
        if (fileSource.length) {
            res.status(409).send({
                message: 'Data already present!'
            })
        } else {
            const fileSource = new fileSourceModel(body)
            if (fileSource) {
                await fileSource.save()
                res.status(201).send(fileSource)
            } else {
                res.status(404).send({
                    message: 'Data found!'
                })
            }
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.getFileSource = async (req, res) => {
    try {
        let fileSourceId = req.params.fileSourceId;
        console.log('fileSourceId:', fileSourceId)
        const fileSource = await fileSourceModel.aggregate([
            { $match: { "_id": mongoose.Types.ObjectId(fileSourceId) } },
            {
                $lookup: {
                    from: 'masterdatas',
                    localField: 'fileName',
                    foreignField: 'categoryCode',
                    as: 'fileNameMaster'
                }
            },
            {
                $lookup: {
                    from: 'masterdatas',
                    localField: 'category',
                    foreignField: 'categoryCode',
                    as: 'categoryMaster'
                }
            },
            {
                $lookup: {
                    from: 'masterdatas',
                    localField: 'language',
                    foreignField: 'categoryCode',
                    as: 'languageMaster'
                }
            },
            {
                $lookup: {
                    from: 'masterdatas',
                    localField: 'fileType',
                    foreignField: 'categoryCode',
                    as: 'fileTypeMaster'
                }
            },
            {
                $lookup: {
                    from: 'placesdatas',
                    localField: 'fileSource',
                    foreignField: 'categoryCode',
                    as: 'placesMaster'
                }
            }
        ])
        if (fileSource) {
            fileSource.filter((data, i) => {
                console.log('dataa', data)
                fileSource[i] = {
                    _id: data._id,
                    fileName: {
                        categoryName: data.fileNameMaster[0].categoryName,
                        categoryCode: data.fileName
                    },
                    category: {
                        categoryName: data.categoryMaster[0].categoryName,
                        categoryCode: data.category
                    },
                    language: {
                        categoryName: data.languageMaster[0].categoryName,
                        categoryCode: data.language
                    },
                    fileType: {
                        categoryName: data.fileTypeMaster[0].categoryName,
                        categoryCode: data.fileType
                    },
                    fileSource: {
                        categoryName: data.placesMaster[0].categoryName,
                        categoryCode: data.fileSource,
                    },
                    fileNameConvention: data.fileNameConvention ? data.fileNameConvention : ''
                }
            })
            res.status(201).send(fileSource)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.getAllFileSource = async (req, res) => {
    try {
        const fileSource = await fileSourceModel.aggregate([{
            $lookup: {
                from: 'masterdatas',
                localField: 'fileName',
                foreignField: 'categoryCode',
                as: 'fileNameMaster'
            }
        },
        {
            $lookup: {
                from: 'masterdatas',
                localField: 'category',
                foreignField: 'categoryCode',
                as: 'categoryMaster'
            }
        },
        {
            $lookup: {
                from: 'masterdatas',
                localField: 'language',
                foreignField: 'categoryCode',
                as: 'languageMaster'
            }
        },
        {
            $lookup: {
                from: 'placesdatas',
                localField: 'fileSource',
                foreignField: 'categoryCode',
                as: 'placesMaster'
            }
        }
        ])
        if (fileSource) {
            const result = fileSource.map((data) => {
                return ({
                    "_id": data._id,
                    // "fileName": data.fileName,
                    "fileSource": data.placesMaster[0].categoryName,
                    "fileType": data.fileType,
                    "language": data.languageMaster[0].categoryName,
                    "category": data.categoryMaster[0].categoryName,
                    "fileName": `${data.fileNameMaster[0].categoryName}-${data.placesMaster[0].categoryName}-${data.languageMaster[0].categoryName}`,
                    "fileNameConvention": data.fileNameConvention ? data.fileNameConvention : ''
                })
            })
            res.status(201).send(result)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.getFileSourceCategory = async (req, res) => {
    try {
        var category = req.params.category;
        const fileSource = await fileSourceModel.find({ category: category })
        if (fileSource) {
            res.status(201).send(fileSource)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}


exports.deleteFilesourceCategoryData = async (req, res) => {
    const fileSourceId = req.params.fileSourceId;
    try {
        // check if fileSource is assigned to any user 
        console.log("fileSourceId:", fileSourceId)
        const user = await userModel.find({ fsAllocated: fileSourceId })
        if (user.length) {
            res.status(409).send({ message: `Can't delete: Filesource is assigned to user` })
        } else {
            const fileSource = await fileSourceModel.findByIdAndDelete({ _id: fileSourceId })
            if (fileSource) {
                console.log(fileSource)
                res.status(201).send({ message: 'Filesource deleted successfully' })
            } else {
                res.status(404).send({ message: 'No Data found' })
            }
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.updateFileSource = async (req, res) => {
    const fileSourceId = req.params.fileSourceId;
    try {
        console.log("fileSourceId:", req.body)
        const fileSource = await fileSourceModel.findByIdAndUpdate({ _id: fileSourceId }, req.body)
        if (fileSource) {
            res.status(201).send(fileSource)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}