var db = require('./../lib/db');
var mongoose = require('mongoose');
var _ = require('underscore');

module.exports = function(modelConfig){
	/*
	 * Default values
	 */
	var schemaObj = {
		createdAt: { type: Date, default: Date.now, index: true},
		updatedAt: { type: Date, default: Date.now, index: true}
	};
	var collectionName = "test";
	var modelName = collectionName;
	/*
	 * Check modelConfig's schema parameter
	 */
	if(_.has(modelConfig, "schema") && _.isObject(modelConfig.schema)){
		schemaObj = modelConfig.schema;
	}
	/*
	 * Check modelConfig's collection parameter
	 */
	if(_.has(modelConfig, "collection") && _.isString(modelConfig.collection)){
		collectionName = modelConfig.collection;
	}
	/*
	 * Check modelConfig's model parameter
	 */
	if(_.has(modelConfig, "model") && _.isString(modelConfig.model)){
		modelName = modelConfig.model;
		//Catch collection name not being set and set it to the model name
		if(modelConfig.collection != collectionName){
			collectionName = modelName;
		}
	}
	
	// Set schema
	var Schema = new mongoose.Schema(schemaObj);
	// Set collection name
	Schema.set('collection', modelConfig.collection);
	// Construct model from `Schema`
	db.hypercube.model(modelName, Schema);
	// Make model accessible from controllers
	var model = db.hypercube.model(modelName);
	//Set collection name
	model.collectionName = Schema.get('collection');
	//Export model name
	//TODO: Handle Methods input
	modelConfig.methods = {

	}
	//TODO: Namespace this output (exports.models?). Also, Why not just return user?
	exports[modelName] = model;
}

