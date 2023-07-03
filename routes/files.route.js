const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");
const filesController = require("../controllers/files.controller");
router.post(
  "/files/createFiles",
  filesController.createFiles /// create file image
);
router.get("/files/files/:userId", filesController.files);
router.put(
  "/files/updateFile/:fileId",
  authMiddleware.Validate,
  filesController.updateFile // edit attached image
);
router.delete(
  "/files/deleteFiles/:_id",
  authMiddleware.Validate,
  filesController.deleteFiles
);
router.get(
  "/files/getPendingFileList",
  authMiddleware.Validate,
  filesController.getPendingFileList
);
router.post(
  "/files/updateStatusVerified",
  authMiddleware.Validate,
  filesController.updateStatusVerified
);

router.get("/files/getFileById/:fileId", filesController.getFileById);

router.get("/files/getFilesCountByNP", filesController.getFilesCountByNP);

router.get("/files/validate/:fileId", filesController.validate);
router.get("/files/validateSurname/:fileId", filesController.validateSurname);
// router.post("/files/validateNamesAndSurnamesDownloadForMoreOptions", === OLd route for IRL
//  filesController.validateNamesAndSurnamesDownloadForMoreOptions);
router.post(
  "/files/validateNamesAndSurnamesDownloadForMoreOptions",
  filesController.validateNamesAndSurnamesDownloadForMoreOptions
);

router.post("streamZipImages", filesController.streamZipImages);
router.post("/getSurnameLocation", filesController.getSurnameLocation);
router.post("/getNameLocation", filesController.getNameLocation);
router.post("/downloadS3PDF", filesController.downloadS3PDF);
module.exports = router;
