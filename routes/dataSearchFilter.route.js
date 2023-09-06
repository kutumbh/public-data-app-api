
const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const dataSearchController = require("../controllers/dataSearchFilter.controller");

router.post(
  "/getSearchFilterData",
  dataSearchController.getSearchFilterData
);
router.post(
  "/getCountsOfSurname",
  dataSearchController.getCountsOfSurname
);
module.exports = router;
