const gotraModel = require('../models/gotra.model')
const surnamesModel = require('../models/surname.model');

exports.getGotraData = async (req, res) => {
  try {
    const gotra = await gotraModel.find().sort({ name: 1 })
    if (gotra) {
      res.status(201).send(gotra)
    } else {
      res.status(404).send({
        message: 'No Data Foundd !'
      })
    }
  } catch (e) {
    res.status(400).send(e)
  }
}
exports.getgotras = async(req, res) => {
  try {
      const community = await surnamesModel.distinct("gotra").sort();
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