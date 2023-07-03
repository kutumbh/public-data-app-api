const placesDataModel = require('../models/placesData.model')

const ITEM_PER_PAGE = 10;
exports.createPlacesData = async({ body }, res) => {
    try {
        const PlacesData = new placesDataModel(body)
        if (PlacesData) {
            await PlacesData.save()
            res.status(201).send(PlacesData)
        } else {
            res.status(404).send({
                message: 'Data found!'
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.getPlaceData = async(req, res) => {
    try {
        let categoryName = req.body.categoryName;
        const placesData = await placesDataModel.find({"categoryName": { "$regex": categoryName}}).sort({ categoryName: 1});
        if (placesData) {
            res.status(201).send(placesData)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.getPlacesDataById = async(req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit)
        // const page = req.params.page;
        const categoryType = req.params.categoryType;
        const categoryName = req.params.categoryName;
        const offset = page ? page * limit : 0;
        const placesData = await placesDataModel.find({ categoryType: categoryType }).sort({ categoryName: 1 })
        .skip(offset) // Always apply 'skip' before 'limit'
        .limit(limit)
        .select("-__v"); // This is your 'page size'
       
        if (placesData) {
            let numOfPlace = await placesDataModel.countDocuments();
            res.status(200).json({
                "message": "Paginating is completed! parameters: page = " + page + ", limit = " + limit,
                "totalPages": Math.ceil(numOfPlace / limit),
                "totalItems": numOfPlace,
                "maxRowlimit": limit,
                "currentPageSize": placesData.length,
                "results": placesData
              });
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

exports.getSearchData = async(req, res)=> {
    try {
        const regex = new RegExp(req.params.categoryName,'i')
        const placesData = await placesDataModel.find({categoryName:regex});
        if(placesData){
            res.status(201).send(placesData)
        } else {
            res.status(404).send({ 
                message:"No Data Found!"
            })
        }
    }
    catch(e){
        res.status(400).send(e)
    }
    }