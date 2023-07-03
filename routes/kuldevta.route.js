const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");
const kuldevtaController = require("../controllers/kuldevta.controller");

router.get(
    "/getkuldevtaData",
    kuldevtaController.getkuldevtaData
);
// getkuldevtaFamilyDeity
router.get(
    "/getkuldevtaFamilyDeity",
    kuldevtaController.getkuldevtaFamilyDeity
);
module.exports = router;