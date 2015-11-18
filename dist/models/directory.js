'use strict';

var db = require('./../utils/db');
var logger = require('./../utils/logger');

var mongoose = require('mongoose');
var _ = require('underscore');
var q = require('q');
var config = require('../config/default').config;
// var Group = require('./group').Group; //undefined?
// var Account = require('./account').Account; //undefined?

//Schema Object
//collection name
//model name

var DirectorySchema = new mongoose.Schema({
	name: { type: String, unique: true, index: true },
	groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
	accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
	createdAt: { type: Date, 'default': Date.now },
	updatedAt: { type: Date, 'default': Date.now }
}, {
	toJSON: { virtuals: true }
});
/*
 * Set collection name to 'account'
 */
DirectorySchema.set('collection', 'directories');

DirectorySchema.virtual('id').get(function () {
	return this._id;
});
// .set(function (id){
// 	return this._id = id;
// });
DirectorySchema.methods = {
	saveNew: function saveNew() {
		var d = q.defer();
		this.save(function (err, newDirectory) {
			if (err) {
				console.error('[Directory.saveNew()] Error saving Directory:', err);
				d.reject(err);
			}
			if (!newDirectory) {
				console.error('[Directory.saveNew()] Directory could not be saved');
				d.reject(Error('Directory could not be saved.'));
			}
			d.resolve(newDirectory);
		});
		return d.promise;
	},
	findAccount: function findAccount(accountData) {
		var d = q.defer();
		//TODO: Find by parameters other than username
		if (accountData && _.has(accountData, 'username')) {
			console.log('account data:', accountData);
			// var account = new Account({username:accountData.username});
			// var query = Account.findOne({username:accountData.username});
			console.log('findAccount for directory', this);
			var aq = this.model('Account').findOne({ username: accountData.username }).populate({ path: 'groups', select: 'name accounts' });
			// d.resolve(account);
			aq.exec(function (err, result) {
				if (err) {
					console.error('[Directory.findAccount()] Error getting account:', JSON.stringify(err));
					return d.reject(err);
				}
				if (!result) {
					console.error('[Directory.findAccount()] Error finding account.');
					return d.reject(null);
				}
				console.log('directory returned:', result);
				d.resolve(result);
			});
		} else {
			console.err('[Directory.findAccount()] Username required to find account.');
			d.reject({ message: 'Account not found.' });
		}
		return d.promise;
	},
	addNewGroup: function addNewGroup(groupData) {
		//Find by name and
		var self = this;

		// if(this.groups.length > 0){
		// 	//Check for group name already exisiting in directory
		// 	_.any(self.groups, function(group){
		// 		if(_.has(group, 'name')){
		// 			//Check
		// 		} else {
		// 			//Groups hasn't been populated
		// 			console.log('Groups has not been populated');
		// 			//query groups based on id?
		// 			var groupQuery = this.model('Group').findById()
		// 		}
		// 	});
		// }
		// return group.saveNew().then(function(){
		// 	self.groups.push(group._id);
		// 	return self.saveNew();
		// });
	},
	addGroup: function addGroup(groupData) {
		var self = this;
		var groupId = groupData; //Assume string
		//Handle group data being an object with an id
		if (_.isObject(groupData) && _.has(groupData, '_id')) {
			groupId = groupData._id;
		}
		//make sure that group does not already exist in directory
		var alreadyExists = _.any(self.groups, function (group) {
			if (_.isObject(group)) {
				//Check
				console.log('group value is an object', group);
				if (_.has(group, '_id') && group._id == groupId) {
					console.log('');
					return true;
				} else {
					return false;
				}
			} else {
				console.log('Groups has not been populated. Group is string?', group);
				return false;
			}
		});
		//add group if it is not already exisiting in directory
		if (!alreadyExists) {
			this.groups.push(group._id);
		}
		return this.saveNew();
	},
	addAccount: function addAccount(account) {
		logger.log({ description: 'addAccount called.', account: account, func: 'addAccount', obj: 'Directory' });
		var d = q.defer();
		var self = this;
		self.accounts.push(account._id);
		return self.saveNew().then(function () {
			logger.log({ description: 'Account successfully added to directory.', directory: self, account: account, func: 'addAccount', obj: 'Directory' });
			d.resolve(self);
		}, function (err) {
			logger.log({ description: 'Error adding account do directory.', account: account, error: err, func: 'addAccount', obj: 'Directory' });
			d.reject(err);
		});
		return d.promise;
	}
};
/*
 * Construct Directory model from DirectorySchema
 */
db.tessellate.model('Directory', DirectorySchema);
/*
 * Make model accessible from controllers
 */
var Directory = db.tessellate.model('Directory');
Directory.collectionName = DirectorySchema.get('collection');

exports.Directory = db.tessellate.model('Directory');