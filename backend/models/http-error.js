class HttpError extends Error {
  //Constructor method allows us to write and run the logic whenver 
  //we instantiate this class and create objects based on this class
  constructor (message, errorCode) {
    super(message); //Add a 'message' property and forward to the baseclass
    this.code = errorCode; //Adds a 'code' property
  }
}

module.exports = HttpError;