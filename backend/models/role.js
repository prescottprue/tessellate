var db = require('./../utils/db');
var mongoose = require('mongoose');
var q = require('q');
var Account = require('../models/account').Account;
var _ = require('underscore');

var RoleSchema = new mongoose.Schema({
	name:{type:String, default:'', unique:true},
	accounts:[{type: mongoose.Schema.Types.ObjectId, ref:'Account'}],
	applications:[{type:mongoose.Schema.Types.ObjectId, ref:'Application'}],
	createdAt: { type: Date, default: Date.now, index: true},
	updatedAt: { type: Date, default: Date.now, index: true}
});
/*
 * Set collection name
 */
RoleSchema.set('collection', 'roles');
/*
 * Setup schema methods
 */
RoleSchema.methods = {
	//Wrap query in promise
	saveNew:function(){
		var d = q.defer();
		console.log('this:', this);
		this.save(function (err, result){
			if(err) { d.reject(err);}
			if(!result){
				d.reject(new Error('New Account could not be saved'));
			}
			d.resolve(result);
		});
		return d.promise;
	},
	addAccount:function(accountData){
		//TODO: Handle adding an account to the Role
		var d = q.defer();
		this.accounts.push(accountData._id);
		this.save(function (err, result){
			if(err) { d.reject(err);}
			if(!result){
				d.reject(new Error('New Account could not be saved'));
			}
			d.resolve(result);
		});
		return d.promise;
	},
	findAccounts:function(){
		var d = q.defer();
		var query = Account.find({role:this.name});
		var self = this;
		query.exec(function (err, accountsList){
			if(err) { d.reject(err);}
			if(!accountsList){
				d.reject(new Error('No accounts found for this role'));
			}
			//Add accounts to list that are not already there
			if(self.accounts.length != accountsList.length){
				console.log('accounts list not the same length');
				self.accounts = accountsList.map(function(account){
					return account._id;
				});
				self.saveNew().then(function(updatedRole){
					//TODO: Handle accounts returning with ids
					var modSelf = _.extend(self);
					modSelf.accounts = accountsList;
					d.resolve(modSelf);
				}, function(err){
					d.reject(err);
				});
			}
			d.resolve(accountsList);
		});
		return d.promise;
	}
};
/*
 * Construct `Role` model from `AccountSchema`
 */
db.hypercube.model('Role', RoleSchema);

/*
 * Make model accessible from controllers
 */
var Role = db.hypercube.model('Role');
Role.collectionName = RoleSchema.get('collection');

exports.Role = db.hypercube.model('Role');