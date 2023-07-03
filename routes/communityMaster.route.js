const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");

const communityController = require("../controllers/communityMaster.controller");
router.get(
    "/getCommunity",
    communityController.getCommunity
);
router.post(
    "/createCommunity",
    communityController.createCommunity
);
router.get(
    "/getCommunityByReligion/:religion",
    communityController.getCommunityByReligion
);
module.exports = router;