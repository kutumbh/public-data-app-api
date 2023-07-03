const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const gotraController = require("../controllers/gotra.controller");

router.get(
    "/getGotraData",
    gotraController.getGotraData
);
router.get(
    "/getgotras",
    gotraController.getgotras
);
module.exports = router;