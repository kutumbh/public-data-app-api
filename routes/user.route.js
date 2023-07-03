const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const userController = require("../controllers/user.controller");

router.post("/user/createUser", userController.createUser);
router.get("/user/getAllUsers", userController.getAllUsers);
router.get("/user/getUserDetails/:uname", userController.getUserDetails);
router.put("/user/updateUser/:id", userController.updateUserDetails);
// router.get("/user/getFilesUploaded", userController.getFilesUploaded);
router.delete("/user/deleteUser/:userId",userController.deleteUser);

module.exports = router;
