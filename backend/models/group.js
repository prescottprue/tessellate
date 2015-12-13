import db from './../utils/db';
import mongoose from 'mongoose';
import q from 'q';
import _ from 'underscore';
import { Application } from './application';
import { Account } from './account';
import logger from '../utils/logger';

let GroupSchema = new mongoose.Schema(
	{
		application:{type: mongoose.Schema.Types.ObjectId, ref:'Application'},
		name:{type:String, default:''},
		accounts:[{type: mongoose.Schema.Types.ObjectId, ref:'Account'}],
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
	addAccount:function(account){
		//TODO: Handle adding an account to the group
		this.save().then((newAccount) => {
			return newAccount
		}, (err) => {
			logger.error('Error', err);
		});
	},
	findAccount: function(accountData) {
		//TODO: Find by parameters other than username
		if(!accountData || !_.has(accountData, 'username')){
			logger.error({
				description: 'Username required to find account.', func: 'findAccount', obj: 'Group'
			});
			return Promise.reject({message:'Account not found.'});
		}
		logger.log({
			description: 'Account data.', accountData: accountData
		});
		var aq = this.model('Account').findOne({username:accountData.username})
		.populate({path:'groups', select:'name accounts'})
		.select({password: 0});
		// d.resolve(account);
		return aq.then((result) => {
			if(!result){
				logger.error({
					description: 'Error finding account.'
				});
				return Promise.reject(null);
			}
			logger.log({
				description: 'directory returned:', result: result, func: 'findAccount', obj: 'Group'
			});
			return result;
		}, (err) => {
			logger.error({
				description: 'Error getting account.', error: err, func: 'findAccount', obj: 'Group'
			});
			return Promise.reject(err);
		});
	},
};
/*
 * Construct `Account` model from `AccountSchema`
 */
db.tessellate.model('Group', GroupSchema);

/*
 * Make model accessible from controllers
 */
let Group = db.tessellate.model('Group');
Group.collectionName = GroupSchema.get('collection');

exports.Group = db.tessellate.model('Group');
