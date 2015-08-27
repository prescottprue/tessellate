var db = require('./../utils/db');
var mongoose = require('mongoose');

var SessionSchema = new mongoose.Schema({
	accountId:{type: mongoose.Schema.Types.ObjectId, ref:'Account'},
	active:{type: Boolean, default:true},
	createdAt: { type: Date, default: Date.now, index: true},
	endedAt: { type: Date, index: true},
	updatedAt: { type: Date, default: Date.now, index: true}
});

SessionSchema.set('collection', 'sessions');
/*
 * Construct `Account` model from `AccountSchema`
 */
db.hypercube.model('Session', SessionSchema);

/*
 * Make model accessible from controllers
 */
var Session = db.hypercube.model('Session');
Session.collectionName = SessionSchema.get('collection');

exports.Session = db.hypercube.model('Session');