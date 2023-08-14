
  const { Router } = require("express");
  var authMiddleware = require("../Middleware/AuthMiddleware");
  const router = Router();
  const searchController = require("../controllers/searchData.controller");

  router.post(
    "/getReligionSearchData",
    searchController.getReligionSearchData
  );
  module.exports = router;
