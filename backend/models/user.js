const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new Schema({
	name: { type: String, required: true },
	//Make sure the email is unique
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true, minlength: 6 },
	image: { type: String, required: true },
	//An user can create multiple places and each place is stored by placeId
  places: [{type: mongoose.Types.ObjectId, required: true, ref: 'Place'}],
});

//Make sure we can query email ASAP and check if it exists
userSchema.plugin(uniqueValidator);

//This will name our user data collection 'users'
module.exports = mongoose.model('User', userSchema);
