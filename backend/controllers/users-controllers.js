const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");

const User = require("../models/user");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
	let users;
	try {
		//find the user based on email and name, without returning password
		users = await User.find({}, "-password");
	} catch (err) {
		const error = new HttpError("Fetching users failed", 500);
		return next(error);
	}
	res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError("Invalid inputs passed, please check your data.", 422)
		);
	}

	const { name, email, password } = req.body;

	let existingUser;
	try {
		existingUser = await User.findOne({ email: email });
	} catch (err) {
		const error = new HttpError("Signing up failed. Pleae try again. ", 500);
		return next(error);
	}

	if (existingUser) {
		const error = new HttpError(
			"User exists already. Please login instead. ",
			422
		);
		return next(error);
	}

	let hashedPassword;
	try {
		/** bycrypt.hash() method
		 * @param s — String to hash
		 * @param salt — Salt length to generate or salt to use
		 * 						 determines how many salt rounds this string will go through
		 */
		//12 salting rounds ensures the hashing cannot be reversed (decrypted)
		hashedPassword = await bcrypt.hash(password, 12);
	} catch (err) {
		const error = new HttpError(
			"Hashing password failed, please try again.",
			500
		);
		return next(error);
	}

	const createdUser = new User({
		name,
		email,
		image: req.file.path,
		password: hashedPassword,
		places: [],
	});

	try {
		await createdUser.save();
	} catch (err) {
		const error = new HttpError("Cannot create user, please try again. ", 500);
		//Stop后面的code execution
		return next(error);
	}

	let token;
	try {
		//1st parameter is the info you want to use and keep to generate the
		//token, and later we can get these info from token as well

		//2nd argument is the private key(a string that only the server knows and
		//should never ever be shared with the client (the React app in our project). 
		//Someone can never replicate or edit the token because they don't know 
		//the private key. 
		//Although someone can decrypte in the frontend and get and edit the userId, 
		//they can never replicate this token because they don't know the private key.

		//3rd argument is how you want to configurate the token (ways to handle it)
		//like when it expires

		//This token will be stored on http client as a user's identity, that indicates
		//if it's logged in or not. This token can be stealed to fake that they are you.
		//but with the expiresIn argument, this token expires and limit time for hackers
		//to mess around
		token = jwt.sign(
			{ userId: createdUser.id, email: createdUser.email },
			process.env.JWT_PRIVATE_KEY,
			{ expiresIn: "1h" }
		);
	} catch (err) {
		const error = new HttpError("Signing up failed. Pleae try again. ", 500);
		return next(error);
	}
	//Decides which info is returned to the frontend
	//we return token here because then the client (in our case it's 
	//the React application), can use and store this token and attach it to future
	//requests to routes on the backend that requires authentication
	res
		.status(201)
		.json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
	const { email, password } = req.body;

	let existingUser;
	try {
		existingUser = await User.findOne({ email: email });
	} catch (err) {
		const error = new HttpError("Logging in failed. Pleae tyr again. ", 500);
		return next(error);
	}
	//Just check for user existence for provided email address
	if (!existingUser) {
		const error = new HttpError(
			"Not a registered user or correct email address. Please signup or try again.",
			403
		);
		return next(error);
	}

	let isValidPassword = false;
	try {
		isValidPassword = await bcrypt.compare(password, existingUser.password);
	} catch (err) {
		const error = new HttpError(
			"Could not log in. Please check your credentials and try again.",
			500
		);
		return next(error);
	}
	//check if the isValidPassword is false (meaning wrong password entered)
	if (!isValidPassword) {
		const error = new HttpError("Invalid credentials, cannot login.", 401);
		return next(error);
	}

	//Generate the token after the email is registered and correct,
	//and password is valid
	let token;
	try {
		//Must use the same private key here as the one used when signing up
		//or else the same user can never log in because the generated token when
		//logging in will be diferent from the token when signning up
		token = jwt.sign(
			{ userId: existingUser.id, email: existingUser.email },
			process.env.JWT_PRIVATE_KEY,
			{ expiresIn: "1h" }
		);
	} catch (err) {
		const error = new HttpError("Logging in failed. Pleae try again. ", 500);
		return next(error);
	}

	res.json({
		userId: existingUser.id,
		email: existingUser.email,
		token: token
	});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
