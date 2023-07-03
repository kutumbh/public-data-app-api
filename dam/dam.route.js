const { Router } = require("express");
const router = Router();
const damController = require("./dam.controller");
var cors = require("cors");
router.get(
    "/dam/assets", cors(),
    damController.getAssets
);
router.get(
    "/dam/assets/:id", cors(),
    damController.getAssetById
);
router.delete("/dam/assets/:id",cors(), damController.deleteAsset);

router.get(
    "/dam/tags", cors(),
    damController.getTags
);


router.post(
    "/dam/upload/:id", cors(),
    damController.upload);

router.post(
    "/dam/assetUpload/:assetTitle/:tags", cors(),
    damController.assetUpload
);

router.post("/dam/assetSearchByTags", damController.assetSearchByTags);

router.post("/dam/search", damController.search);
router.post("/dam/updateAsset", cors(), damController.updateAsset);


module.exports = router;