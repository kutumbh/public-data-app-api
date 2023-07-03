const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");
const personsController = require("../controllers/persons.controller");

router.post(
  "/persons/createPersons",
  authMiddleware.Validate,
  personsController.createPersons
);
router.get(
  "/persons/getAllPersons/:fileId",
  authMiddleware.Validate,
  personsController.getAllPersons
);
router.put(
  "/persons/updatePersons/:id",
  authMiddleware.Validate,
  personsController.updatePersons
);
router.get(
  "/persons/getOnePerson/:_id",
  authMiddleware.Validate,
  personsController.getOnePerson
);
router.delete(
  "/persons/deletePerson/:_id",
  authMiddleware.Validate,
  personsController.deletePerson
);

router.get(
  "/persons/searchPerson",
  // authMiddleware.Validate,
  personsController.searchPersons
);
router.get(
  "/persons/searchSurname",
  // authMiddleware.Validate,
  personsController.searchSurname
);
router.post(
  "/persons/getPersonByImage",
  authMiddleware.Validate,
  personsController.getPersonByImage
);

router.post(
  "/updatePersonTranslietration",
  personsController.updatePersonTranslietration
);
router.post(
  "/persons/searchSurnameByCategory/:category",
  personsController.searchSurnameByCategory
);

module.exports = router;
