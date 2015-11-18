'use strict';

var db = require('./../utils/db');
var mongoose = require('mongoose');
var q = require('q');
var _ = require('underscore');
var Application = require('./application').Application;
var Account = require('./account').Account;
var logger = require('../utils/logger');

var GroupSchema = new mongoose.Schema({
	application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
	name: { type: String, 'default': '' },
	accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
	createdAt: { type: Date, 'default': Date.now },
	updatedAt: { type: Date, 'default': Date.now, index: true }
}, {
	toJSON: { virtuals: true }
});
/*
 * Set collection name
 */
GroupSchema.set('collection', 'groups');
/*
 * Setup schema methods
 */
GroupSchema.methods = {
	//Wrap query in promise
	saveNew: function saveNew() {
		var d = q.defer();
		this.save(function (err, result) {
			if (err) {
				d.reject(err);
			}
			if (!result) {
				d.reject(new Error('New Group could not be saved'));
			}
			d.resolve(result);
		});
		return d.promise;
	},
	addAccount: function addAccount(account) {
		//TODO: Handle adding an account to the group
		this.saveNew().then(function () {}, function (err) {
			logger.error('Error', err);
		});
	},
	findAccount: function findAccount(accountData) {
		//TODO: Find by parameters other than username
		if (accountData && _.has(accountData, 'username')) {
			logger.log({ description: 'Account data.', accountData: accountData });
			// var account = new Account({username:accountData.username});
			// var query = Account.findOne({username:accountData.username});
			logger.log('findAccount for group', undefined);
			var aq = undefined.model('Account').findOne({ username: accountData.username }).populate({ path: 'groups', select: 'name accounts' }).select({ password: 0 });
			// d.resolve(account);
			return aq.then(function (result) {
				if (!result) {
					logger.error({ description: 'Error finding account.' });
					return Promise.reject(null);
				}
				logger.log({ description: 'directory returned:', result: result, func: 'findAccount', obj: 'Group' });
				return result;
			}, function (err) {
				logger.error({ description: 'Error getting account.', error: err, func: 'findAccount', obj: 'Group' });
				return Promise.reject(err);
			});
		} else {
			logger.error({ description: 'Username required to find account.', func: 'findAccount', obj: 'Group' });
			return Promise.reject({ message: 'Account not found.' });
		}
	}
};
/*
 * Construct `Account` model from `AccountSchema`
 */
db.tessellate.model('Group', GroupSchema);

/*
 * Make model accessible from controllers
 */
var Group = db.tessellate.model('Group');
Group.collectionName = GroupSchema.get('collection');

exports.Group = db.tessellate.model('Group');