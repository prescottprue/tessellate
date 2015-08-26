//TODO: Don't require mongoose
var mongoose = require('mongoose');
module.exports = {
	user:{
		schema:{
			_id: {type: mongoose.Schema.Types.ObjectId, index:true},
			name:{type: String, default:''},
			email:{type: String, default:''},
			title:{type: String, default:''},
			password:{type: String, default:''},
			role:{type: String, default:''},
			createdAt: { type: Date, default: Date.now, index: true},
			updatedAt: { type: Date, default: Date.now, index: true}
		},
		collection: "user", // Where it is stored in the db //TODO: Use the object name if this doesn't exist
		model: "User" // What its used as in controllers
	},
	session:{
		schema:{
			_id: {type: mongoose.Schema.Types.ObjectId, index:true},
			userId:{type: mongoose.Schema.Types.ObjectId},
			active:{type: Boolean, default:true},
			createdAt: { type: Date, default: Date.now, index: true},
			endedAt: { type: Date, default: Date.now, index: true},
			updatedAt: { type: Date, default: Date.now, index: true}
		},
		collection:"session",
		model: "Session"
	}
};