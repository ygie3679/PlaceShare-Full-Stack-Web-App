const HttpError = require("../models/http-error");

const { validationResult } = require("express-validator");

const getCoordsForAddress = require("../util/location");

const mongoose = require("mongoose");

//Import place model we created in models/place.js
const Place = require("../models/place");

const User = require("../models/user");

const fs = require("fs");

//'CRUD'中的‘R' read
const getPlaceById = async (req, res, next) => {
	const placeId = req.params.pid; //{pid: 'p1'}

	let place;
	try {
		//Mongoose default method findById, does not return a promise
		//but can if we write Place.findById().exec() to make it return a real promise and await
		place = await Place.findById(placeId);
	} catch (err) {
		const error = new HttpError(
			"Something went wrong. Could not find a place.",
			500
		);
		return next(error);
	}

	if (!place) {
		//Directly pass message and code as parameters to HttpError, as we defined it
		const error = new HttpError(
			"Could not find a place for the provided id.",
			404
		);
		return next(error);
	}
	//getters: true here is to remove the underscore before id
	res.json({ place: place.toObject({ getters: true }) });
};

/**
 * Here we use arrow-function syntax.
 * But there are other ways to create functions:
 */
// function getPlaceById() {...}
// const getPlaceById = function() {...}

//'CRUD'中的‘R' read
const getPlacesByUserId = async (req, res, next) => {
	const userId = req.params.uid;

	// let places;
	let userWithPlaces;
	try {
		//Use filter() instead of find() here so that we get an array
		//with all places under this userId. If we use find(), we can only
		//get the first element that qualifies.
		// places = await Place.find({ creator: userId });

		userWithPlaces = await User.findById(userId).populate("places");
	} catch (err) {
		const error = new HttpError(
			"Fetching places failed. Please try again. ",
			500
		);
		return next(error);
	}

	//if (!places || places.length === 0)
	if (!userWithPlaces || userWithPlaces.length === 0) {
		return next(
			//Directly pass message and code as parameters to HttpError, as we defined it
			new HttpError("Could not find a places for the provided user id.", 404)
		);
	}

	res.json({
		//Since the places variable is an array here, and toObject() method
		//cannot be used on an array, we can use map() and each place in places
		//uses toObject() to change '_id' to 'id'.
		places: userWithPlaces.places.map((place) =>
			place.toObject({ getters: true })
		),
	});
};

//Also a default middleware function:
//‘CRUD'中的‘C' create
const createPlace = async (req, res, next) => {
	//Look into the request body and check for errors using express validator
	const errors = validationResult(req);
	//If errors is not empty, it means we do have errors
	if (!errors.isEmpty()) {
		return next(
			new HttpError("Invalid inputs passed, please check your data.", 422)
		);
	}

	//get the request body of post request
	//Use object destructuring把req.body中的元素分别存进tittle, description...等
	const { title, description, address} = req.body;

	let coordinates;
	try {
		coordinates = await getCoordsForAddress(address);
	} catch (error) {
		return next(error);
	}

	const createdPlace = new Place({
		//Add data to our place model
		title,
		description,
		address,
		location: coordinates,
		image: req.file.path,
		//Not getting user id from frontend since it could be invalid, 
		//instead extract the id from token which will be attched anyway
		//and cannot be faked
		//the req.userData.userId is the automatic extracted data from check-auth.js
		creator: req.userData.userId,
	});

	//Check if the userId exists
	let user;
	try {
		user = await User.findById(req.userData.userId);
	} catch (err) {
		const error = new HttpError(
			"Creating place failed, please try again.",
			500
		);
		return next(error);
	}

	if (!user) {
		const error = new HttpError("Could not find user for provided id", 404);
		return next(error);
	}

	console.log(user);

	//Handle all mongoDB code you need to store document into your database
	//Will also create unique ObjectId for the new document
	try {
		//Current session that starts when we want to create this new place
		const session = await mongoose.startSession();
		//In current session, start our transaction
		session.startTransaction();
		//Tell mogoose what we want to do here (create a place and save it to database)
		await createdPlace.save({ session: session });
		//Make sure the placeId is added to user. Not the basic push() method, is a special
		//mongoose func here to establish relationship between users and places(only adds the placeId)
		user.places.push(createdPlace);
		await user.save({ session: session });
		//If no error above, then data will be stored to db here. If there is any error in the session
		//or transaction, operations will be automatically rolled back by mongoDB
		await session.commitTransaction();
	} catch (err) {
		const error = new HttpError(
			"Creating a place failed, please try again. ",
			500
		);
		//Stop后面的code execution
		return next(error);
	}

	res.status(201).json({ place: createdPlace });
};

//'CRUD'中的‘U' update
const updatePlace = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError("Invalid inputs passed, please check your data.", 422)
		);
	}

	const { title, description } = req.body;
	const placeId = req.params.pid;

	let place;
	try {
		place = await Place.findById(placeId);
	} catch (err) {
		const error = new HttpError(
			"Something went wrong. Could not update place.",
			500
		);
		return next(error);
	}

	//If current user isn't the creator of this place
	if (place.creator.toString() !== req.userData.userId) {
		const error = new HttpError("You are not allowed edit this place.", 401);
		return next(error);
	}

	place.title = title;
	place.description = description;

	//Store the updated information of place
	try {
		await place.save();
	} catch (err) {
		const error = new HttpError("Could not update and save place.", 500);
		return next(error);
	}

	res.status(200).json({ place: place.toObject({ getters: true }) });
};

//'CRUD'中的‘D', delete
const deletePlace = async (req, res, next) => {
	const placeId = req.params.pid;

	let place;
	try {
		//We want to also delete the place in the user's document
		//populate() allows us to refer to a document in another data collection
		//and update its data
		//This method can only be used if those data collections have relations (used populate())
		place = await Place.findById(placeId).populate("creator");
	} catch (err) {
		const error = new HttpError(
			"Something went wrong. Could not find the place to delete.",
			500
		);
		return next(error);
	}

	if (!place) {
		const error = new HttpError("Could not find place for this id.", 404);
		return next(error);
	}

	//Check if the place is created by the current logged in user:
	if (place.creator.id !== req.userData.userId) {
		const error = new HttpError("You are not allowed delete this place.", 401);
		return next(error);
	}
	

	const imagePath = place.image;

	//get rid of the place from user after we delete a place
	try {
		const ses = await mongoose.startSession();
		ses.startTransaction();
		await place.deleteOne({ session: ses });
		//Pull will automatically remove the place's id only
		place.creator.places.pull(place);
		await place.creator.save({ session: ses });
		await ses.commitTransaction();
	} catch (err) {
		const error = new HttpError("Could not delete the place.", 500);
		return next(error);
	}

	//delete the place image
	fs.unlink(imagePath, (err) => {
		console.log(err);
	});

	res.status(200).json({ message: "Deleted place." });
};

//Use this to export multiple things:
//Here we don't execute the getPlaceById function so we don't write
//exports.getPlacesById = getPlaceById() with brackets
//Instead, we only export a pointer here to let Express know which function
//should be executed.
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
