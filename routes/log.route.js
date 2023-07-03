const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const logController = require("../controllers/log.controller");

router.post("/createLog", logController.createLog);
router.get("/getLog",  authMiddleware.Validate, logController.getLog);
router.post("/logsFilter", logController.logsFilter);

module.exports = router;
