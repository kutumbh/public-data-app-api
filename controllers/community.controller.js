const communityModel = require('../models/community.model')
const surnamesModel = require('../models/surname.model');
// 

exports.getCommunityData = async(req, res) => {
    try {
        const community = await communityModel.find().sort({ name: 1});
        if (community) {
            res.status(201).send(community)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.getCommunityDataFromSurname = async(req, res) => {
    try {
        const community = await surnamesModel.distinct("community").sort();
        if (community) {
            res.status(201).send(community)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
