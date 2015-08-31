var db = require('./../utils/db');
var mongoose = require('mongoose');
var q = require('q');
var _ = require('underscore');
var Application = require('./application').Application;
var Account = require('./account').Account;

var GroupSchema = new mongoose.Schema({
	application:{type: mongoose.Schema.Types.ObjectId, ref:'Application'},
	name:{type:String, default:''},
	accounts:[{type: mongoose.Schema.Types.ObjectId, ref:'Account'}],
	createdAt: { type: Date, default: Date.now},
	updatedAt: { type: Date, default: Date.now, index: true}
},
	{
		toJSON:{virtuals:true}
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
	saveNew:function(){
		var d = q.defer();
		this.save(function (err, result){
			if(err) { d.reject(err);}
			if(!result){
				d.reject(new Error('New Group could not be saved'));
			}
			d.resolve(result);
		});
		return d.promise;
	},
	addAccount:function(account){
		//TODO: Handle adding an account to the group
		this.saveNew().then(function(){

		}, function(err){
			console.error('Error', err);
		});
	},
	findAccount:function(accountData){
		var d = q.defer();
		//TODO: Find by parameters other than username
		if(accountData && _.has(accountData, 'username')){
			console.log('account data:', accountData);
			// var account = new Account({username:accountData.username});
			// var query = Account.findOne({username:accountData.username});
			console.log('findAccount for group', this);
			var aq = this.model('Account').findOne({username:accountData.username}).populate({path:'groups', select:'name accounts'});
			// d.resolve(account);
			aq.exec(function (err, result){
				if(err){
					console.error('[Directory.findAccount()] Error getting account:', JSON.stringify(err));
					return d.reject(err);
				}
				if(!result){
					console.error('[Directory.findAccount()] Error finding account.');
					return d.reject(null);
				}
				console.log('directory returned:', result);
				d.resolve(result);
			});
		} else {
			console.err('[Directory.findAccount()] Username required to find account.');
			d.reject({message:'Account not found.'});
		}
		return d.promise;
	},
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
