const surnameTypeModel = require('../models/surnameType.model')

exports.getSurnameType = async(req, res) => {
    try {
        const getSurnameType = await surnameTypeModel.find().distinct('name')
        if (getSurnameType) {
            res.status(201).send(getSurnameType)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.createSurnameType = async ({ body }, res) => {
    try {
        const getSurnameType = new surnameTypeModel(body)
        if (getSurnameType) {
            await getSurnameType.save()
            res.status(201).send(getSurnameType)
        } else {
            res.status(404).send({
                message: 'Data found!'
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
