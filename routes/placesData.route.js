const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const placesDataController = require("../controllers/placesData.controller");

router.post("/placesData/createPlacesData", authMiddleware.Validate, placesDataController.createPlacesData);
router.post("/placesData/getPlaceData", placesDataController.getPlaceData);
router.get("/placesData/getPlacesDataById/:categoryType", placesDataController.getPlacesDataById);
router.get("/placesData/getSearchData/:categoryName" , placesDataController.getSearchData);

module.exports = router;