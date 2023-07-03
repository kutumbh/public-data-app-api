const religionModel = require('../models/religion.model')

exports.getReligionData = async(req, res) => {
    try {
        const religion = await religionModel.find().sort({ name: 1});
        if (religion) {
            res.status(201).send(religion)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}