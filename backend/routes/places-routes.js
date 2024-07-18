//require() in Express is like 'import'
const express = require("express");
//import the check middleware function of express validator
const { check } = require("express-validator");

const placesControllers = require("../controllers/places-controllers");

const router = express.Router();

const fileUpload = require('../middleware/file-upload');

const checkAuth = require('../middleware/check-auth');

//Use placesControllers to get the pointer of getPlaceById
router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

//Make sure requests must have a token. The middlewares below this one
//will never be reached if a request does not have a token. This middleware
//will block its journey to the other routes
router.use(checkAuth);

//Make sure title is not empty, description has a min length of 5 characters,
//and address is not empty
router.post(
	"/",
	fileUpload.single('image'),
	[
		check("title").not().isEmpty(),
		check("description").isLength({ min: 5 }),
		check("address").not().isEmpty(),
	],
	placesControllers.createPlace
);

router.patch(
	"/:pid",
	[
    check("title").not().isEmpty(), 
    check("description").isLength({ min: 5 })
  ],
	placesControllers.updatePlace
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
