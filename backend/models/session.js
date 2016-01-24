import mongoose from 'mongoose';
import db from './../utils/db';

let SessionSchema = new mongoose.Schema(
	{
		userId:{type: mongoose.Schema.Types.ObjectId, ref:'User'},
		active:{type: Boolean, default:true},
		createdAt: { type: Date, default: Date.now, index: true},
		endedAt: { type: Date, index: true},
		updatedAt: { type: Date, default: Date.now, index: true}
	}
);

SessionSchema.set('collection', 'sessions');
/*
 * Construct `User` model from `UserSchema`
 */
db.tessellate.model('Session', SessionSchema);

/*
 * Make model accessible from controllers
 */
let Session = db.tessellate.model('Session');
Session.collectionName = SessionSchema.get('collection');

exports.Session = db.tessellate.model('Session');
