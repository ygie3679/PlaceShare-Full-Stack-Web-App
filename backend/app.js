const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

//This placeRoutes constant is a middleware we imported from places-routes.js
const placesRoutes = require("./routes/places-routes");

const usersRoutes = require("./routes/users-routes");

const HttpError = require("./models/http-error");
//A node.js core module: filesystem modul fs:
const fs = require("fs");
const path = require('path');

const app = express();

//Add this new middleware before Express reaches the placesRoutes,
//because middlewares will be parsed top to bottom, so we want to first
//parse the request body then reach the routes where needs the bodys
app.use(bodyParser.json());

//requests which have localhost:5000/uploads/images will be handled
//show the user avatar image on page
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

//Add certain headers to the response, so later when a response is sent back
//from our more specific routes, it does have these headers attached
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization"
	);
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

	next();
});

//This placesRoutes is added as a middleware in app.js
//Only paths start with /api/places... will be forward to placesRoutes
app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

//register a normal middleware handling all requests comes after our routes
//only runs if there are some request that we didn't get a response before
app.use((req, res, next) => {
	const error = new HttpError("Could not find this route.", 404);
	throw error;
});

//After adding the first parameter 'error', now it has 4 parameters
//Express.js will recogonize this and treat it as a special
//error-handling middleware function.
//It will only be executed if any middleware before it yeilds an error
app.use((error, req, res, next) => {
	if (req.file) {
		try {
			fs.unlink(req.file.path, (err) => {
			console.log(err);
		});
		} catch (error) {
			console.log(req.file);
			console.log('Failed to remove file:', error.message);
		}
		
	}
	if (res.headerSent) {
		return next(error);
	}
	//Check if on the error object, its 'code' is undefined,
	//If it's undefined, we'll fall back to 500 as a default '500' code,
	//indicating there is an error on the server
	res.status(error.code || 500);

	res.json({ message: error.message || "An unknown error occurred!" });
});

//returns a promise as an async task
mongoose
	.connect(
		//process is a feature provided by Node.js that by using the 'env' key,
		//we get access to environment variables that injected to the running process of Node.js
		//and nodemon.json here injects those variables and values
		`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ud-mernbackend.upbpuov.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Ud-MERNBackend`
	)
	.then(() => {
		app.listen(process.env.PORT || 5000);
	})
	.catch((err) => {
		console.log(err);
	});
