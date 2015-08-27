var db = require('./../utils/db');
var mongoose = require('mongoose');
var _ = require('underscore');
var Q = require('q');
var config = require('../config/default').config;
var Group = require('./group').Group;
var Account = require('./account').Account;

//Schema Object
//collection name
//model name

var DirectorySchema = new mongoose.Schema(
	{
		name:{type: String, unique:true, index:true},
		groups:[{type:mongoose.Schema.Types.ObjectId, ref:'Group'}],
		accounts:[{type:mongoose.Schema.Types.ObjectId, ref:'Account'}],
		createdAt: { type: Date, default: Date.now},
		updatedAt: { type: Date, default: Date.now}
	},
	{
		toJSON:{virtuals:true}
	}
);
/*
 * Set collection name to 'account'
 */
DirectorySchema.set('collection', 'accounts');

// DirectorySchema.virtual('id')
// .get(function (){
// 	return this._id;
// })
// .set(function (id){
// 	return this._id = id;
// });
DirectorySchema.methods = {
	saveNew: function(){
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
	findAccount:function(accountData){
		var d = Q.defer();
		//TODO: Find by parameters other than username
		if(accountData && _.has(accountData, 'username')){
			var aq = new Account(accountData).find({username:accountData.username});
			aq.exec(function (err, result){
				if(err){
					console.error('[Directory.findAccount()] Error getting account:', JSON.stringify(err));
					return d.reject(err);
				}
				if(!result){
					console.error('[Directory.findAccount()] Error finding account.');
					return d.reject(null);
				}
				d.resolve(result);
			});
		}
		return d.promise;
	},
	addNewGroup:function(){
		var group = new Group(groupData);
		var self = this;
		return group.saveNew().then(function(){
			self.groups.push(group._id);
			return self.saveNew();
		});
	},
	addGroup:function(group){
		//TODO: make sure that group does not already exist
		this.groups.push(group._id);
		return this.saveNew();
	},
	addAccount:function(account){
		this.accounts.push(account._id);
		return this.saveNew();
	}
};
/*
 * Construct Directory model from DirectorySchema
 */
db.hypercube.model('Directory', DirectorySchema);
/*
 * Make model accessible from controllers
 */
var Directory = db.hypercube.model('Directory');
Directory.collectionName = DirectorySchema.get('collection');

exports.Directory = db.hypercube.model('Directory');
