const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const surnameType = require("../controllers/surnameType.controller");

router.get(
    "/getSurnameType",
    surnameType.getSurnameType
);
router.post("/createSurnameType", surnameType.createSurnameType);

module.exports = router;