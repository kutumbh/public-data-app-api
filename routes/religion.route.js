const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");
const religionController = require("../controllers/religion.controller");

router.get(
    "/getReligionData",
    religionController.getReligionData
);
module.exports = router;