const communityDataModel = require('../models/communityMaster.model')
exports.getCommunity = async(req, res) => {
    try {
        const communityData = await communityDataModel.find();
        if (communityData) {
            res.status(201).send(communityData)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.createCommunity = async({ body }, res) => {
    try {
        const communityData = new communityDataModel(body)
        if (communityData) {
            await communityData.save()
            res.status(201).send(communityData)
        } else {
            res.status(404).send({
                message: 'Data found!'
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.getCommunityByReligion = async(req, res) => {
    try {
        const religion = req.params.religion;
        const communityData = await communityDataModel.find({religion:religion});
        if (communityData) {
            res.status(201).send(communityData)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}