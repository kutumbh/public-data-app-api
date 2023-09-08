const scriptModel = require('../models/script.model')

exports.getScriptData = async(req, res) => {
    try {
        const scriptData = await scriptModel.find().distinct('name').sort()
        if (scriptData) {
            res.status(201).send(scriptData)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}