const kuldevtaModel = require('../models/kuldevta.model')
const surnamesModel = require('../models/surname.model');
exports.getkuldevtaData = async(req, res) => {
    try {
        const kuldevta = await kuldevtaModel.find().sort({ name: 1});
        if (kuldevta) {
            res.status(201).send(kuldevta)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.getkuldevtaFamilyDeity = async(req, res) => {
    try {
        const community = await surnamesModel.distinct("kuldevtaFamilyDeity").sort();
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