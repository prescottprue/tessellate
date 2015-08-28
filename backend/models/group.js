var db = require('./../utils/db');
var mongoose = require('mongoose');
var q = require('q');
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
	}
};
/*
 * Construct `Account` model from `AccountSchema`
 */
db.hypercube.model('Group', GroupSchema);

/*
 * Make model accessible from controllers
 */
var Group = db.hypercube.model('Group');
Group.collectionName = GroupSchema.get('collection');

exports.Group = db.hypercube.model('Group');
