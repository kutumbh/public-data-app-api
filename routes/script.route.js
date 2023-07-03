const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const scriptController = require("../controllers/script.controller");

router.get(
    "/getScriptData",
    scriptController.getScriptData
);
module.exports = router;