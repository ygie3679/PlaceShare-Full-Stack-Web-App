//In this file, we write all logic to validate an incoming request for its token

const HtttpError = require("../models/http-error");
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  //When it comes to any request except 'GET', the browser will first send a 
  //'OPTIONS' request before it sends the actual request, to find out the whether
  //the server permits to send the actual request.
  if (req.method === 'OPTIONS') {
    //Allow this request to continue (Allow the 'OPTION' request to trigger the
    //actual 'POST' request) so that the token will still be validated
    return next();
  }
  
	try {
		//encoding token in the headers of an incoming request
		//in the form of: Authorization: 'Bearer TOKEN'
		//using split() on the value of the Authorization will generate an array of
		//2 values: ['Bearer', 'TOKEN'], and we will get its 2nd argument
		const token = req.headers.authorization.split(" ")[1];
    //Handles error when headers does not contain a token
		if (!token) {
			throw new Error('Authentication failed!');
		}
    //When the token exists, we verify if the token is valid using private key
    //It returns the payload (info like userId and email we used to generate the token)
    const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    //Get userId from the payload (decodedToken object) and add to request body
    //Then every request thereafter can use this userData 
    req.userData = {userId: decodedToken.userId};
    //Allow the request to continue its journey to other routes
    next();

	} catch (err) {
    //Handles error when req.headers.authorization is not set at all
    const error = new HtttpError("Authentication failed!", 403);
			return next(error);
  }
};
