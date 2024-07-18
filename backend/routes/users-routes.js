//require() in Express is like 'import'
const express = require("express");

const { check } = require("express-validator");

const usersController = require("../controllers/users-controllers");

const router = express.Router();
const fileUpload = require("../middleware/file-upload");

//Use placesControllers to get the pointer of getPlaceById
router.get("/", usersController.getUsers);

router.post(
	"/signup",
	fileUpload.single("image"),
	[
		check("name").not().isEmpty(),
		//Check the syntax of email using built in normalizeEmail() method
		check("email").normalizeEmail().isEmail(),
		check("password").isLength({ min: 6 }),
	],
	usersController.signup
);

router.post("/login", usersController.login);

module.exports = router;
