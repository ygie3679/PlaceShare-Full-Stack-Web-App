const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//This new schema object contains the blueprint of a new place
const placeSchema = new Schema({
  //Title must be string and cannot be empty
  title: {type: String, required: true},
  description: {type: String, required: true},
  //image is an url pointing to the image file, not stored in our database
  image: {type: String, required: true},
  address: {type: String, required: true},
  location: {
    lat: {type: Number, required: true},
    lng: {type: Number, required: true},
  },
  //Relates the actual userId to schema of places
  creator: {type: mongoose.Types.ObjectId, required: true, ref: 'User'},
});

//model() is a mongoose method that returns a constructor function
//Pass in the model name 'Place' and schema of this model
module.exports = mongoose.model('Place', placeSchema);

