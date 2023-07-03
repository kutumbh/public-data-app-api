const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const masterDataController = require("../controllers/masterData.controller");

router.post("/masterData/createMasterData", authMiddleware.Validate, masterDataController.createMasterData);
router.get("/masterData/getMasterData", authMiddleware.Validate, masterDataController.getMasterData);
router.get("/masterData/getMasterByCatgoryType/:categoryType", masterDataController.getMasterByCatgoryType);
router.get("/masterData/getMasterByCatgoryType/:categoryType/:classification", masterDataController.getMasterByCatgoryTypeClassification);
router.get("/masterData/getMasterByCatgoryCode/:categoryCode", masterDataController.getMasterByCatgoryCode);

module.exports = router;