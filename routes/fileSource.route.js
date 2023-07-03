const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");
const fileSourceController = require("../controllers/fileSource.controller");
router.post(
    "/createFileSource",
    authMiddleware.Validate,
    fileSourceController.createFileSource
);

router.get(
    "/getAllFileSource",
    fileSourceController.getAllFileSource
);

router.get(
    "/getFileSource/:fileSourceId",
    authMiddleware.Validate,
    fileSourceController.getFileSource
);

// module.exports = router;
// const fileSourceController = require("../controllers/fileSource.controller");
router.get(
    "/getFileSourceCategory/:category",
    fileSourceController.getFileSourceCategory
);
router.delete(
    "/deleteFilesourceCategoryData/:fileSourceId",
    authMiddleware.Validate,
    fileSourceController.deleteFilesourceCategoryData
);

router.put(
    "/updateFileSource/:fileSourceId",
    authMiddleware.Validate,
    fileSourceController.updateFileSource
);
module.exports = router;