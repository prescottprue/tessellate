import db from './../utils/db';
import mongoose from 'mongoose';
import q from 'q';
import _ from 'underscore';
import { Application } from './application';
import { User } from './user';
import logger from '../utils/logger';

let GroupSchema = new mongoose.Schema(
	{
		application:{type: mongoose.Schema.Types.ObjectId, ref:'Project'},
		name:{type:String, default:''},
		users:[{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
		createdAt: { type: Date, default: Date.now},
		updatedAt: { type: Date, default: Date.now, index: true}
	},
	{
		toJSON:{virtuals:true}
	}
);
/*
 * Set collection name
 */
GroupSchema.set('collection', 'groups');
/*
 * Setup schema methods
 */
GroupSchema.methods = {
	addUser:function(user){
		//TODO: Handle adding an user to the group
		this.save().then((newUser) => {
			return newUser
		}, (err) => {
			logger.error('Error', err);
		});
	},
	findUser: function(userData) {
		//TODO: Find by parameters other than username
		if(!userData || !_.has(userData, 'username')){
			logger.error({
				description: 'Username required to find user.', func: 'findUser', obj: 'Group'
			});
			return Promise.reject({message:'User not found.'});
		}
		logger.log({
			description: 'User data.', userData: userData
		});
		var aq = this.model('User').findOne({username:userData.username})
		.populate({path:'groups', select:'name users'})
		.select({password: 0});
		// d.resolve(user);
		return aq.then((result) => {
			if(!result){
				logger.error({
					description: 'Error finding user.'
				});
				return Promise.reject(null);
			}
			logger.log({
				description: 'directory returned:', result: result, func: 'findUser', obj: 'Group'
			});
			return result;
		}, (err) => {
			logger.error({
				description: 'Error getting user.', error: err, func: 'findUser', obj: 'Group'
			});
			return Promise.reject(err);
		});
	},
};
/*
 * Construct `User` model from `UserSchema`
 */
db.tessellate.model('Group', GroupSchema);

/*
 * Make model accessible from controllers
 */
let Group = db.tessellate.model('Group');
Group.collectionName = GroupSchema.get('collection');

exports.Group = db.tessellate.model('Group');
