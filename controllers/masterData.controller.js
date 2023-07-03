const masterDataModel = require('../models/masterData.model');
exports.createMasterData = async({ body }, res) => {
        try {

            const masterData = new masterDataModel(body)
            if (masterData) {
                await masterData.save()
                res.status(201).send(masterData)
            } else {
                res.status(404).send({
                    message: 'Data found!'
                })
            }
        } catch (e) {
            res.status(400).send(e)
        }
    }
    // --------------------------------- API GET ONE PERSON DATA -------------


// --------------------------------- API GET All PERSONS DATA -------------
exports.getMasterData = async(req, res) => {
        try {
            // var id = req.params.pId;
            const masterData = await masterDataModel.find();
            if (masterData) {
                res.status(201).send(masterData)
            } else {
                res.status(404).send({ message: 'No Data found' })
            }
        } catch (e) {
            res.status(400).send(e)
        }
    }
    // --------------------------------- API GET All PERSONS DATA -------------
exports.getMasterByCatgoryType = async(req, res) => {
    try {
        const categoryType = req.params.categoryType;
        console.log("categoryType:", categoryType)
        let sortOrder = (categoryType == 'FS' || categoryType == 'AG') ? { sortIndex: 1 } : { categoryName: 1 };
        // let sortOrder = { categoryName: 1 };
        const masterData = await masterDataModel.find({ categoryType: categoryType }).sort(sortOrder);
        if (masterData) {
            res.status(201).send(masterData)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.getMasterByCatgoryTypeClassification = async(req, res) => {
    try {
        const categoryType = req.params.categoryType;
        const classification = req.params.classification;
        console.log("categoryType:", categoryType)
        let sortOrder = (categoryType == 'FS' || categoryType == 'AG') ? { sortIndex: 1 } : { categoryName: 1 };
        // let sortOrder = { categoryName: 1 };
        const masterData = await masterDataModel.find({ categoryType: categoryType, classification: classification }).sort(sortOrder);
        if (masterData) {
            res.status(201).send(masterData)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.getMasterByCatgoryCode = async(req, res) => {
    try {
        const categoryCode = req.params.categoryCode;
        console.log("categoryType:", categoryType)
        let sortOrder = { categoryName: 1 };
        const masterData = await masterDataModel.find({ categoryCode: categoryCode }).sort(sortOrder);
        if (masterData) {
            res.status(201).send(masterData)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}