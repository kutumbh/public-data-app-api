const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const entityLog = require("../controllers/entityLog.controller");

router.get(
    "/getEntityLogById/:_id",
    entityLog.getEntityLogById
);


module.exports = router;