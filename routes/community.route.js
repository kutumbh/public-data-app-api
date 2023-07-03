const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const communityController = require("../controllers/community.controller");

/** 
* @swagger
* /getCommunityData:
*   get: 
*       description : Fetch the community data 
*       responses : 
*           '200': 
*               description: Successful response for community data 
 */
router.get(
    "/getCommunityData",
    communityController.getCommunityData
);
router.get(
    "/getCommunityDataFromSurname",
    communityController.getCommunityDataFromSurname
);
module.exports = router;

