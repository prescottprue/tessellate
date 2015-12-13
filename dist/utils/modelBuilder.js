'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (modelConfig) {
	/*
  * Default values
  */
	var schemaObj = {
		createdAt: { type: Date, default: Date.now, index: true },
		updatedAt: { type: Date, default: Date.now, index: true }
	};
	var collectionName = "test";
	var modelName = collectionName;
	/*
  * Check modelConfig's schema parameter
  */
	if (_lodash2.default.has(modelConfig, "schema") && _lodash2.default.isObject(modelConfig.schema)) {
		schemaObj = modelConfig.schema;
	}
	/*
  * Check modelConfig's collection parameter
  */
	if (_lodash2.default.has(modelConfig, "collection") && _lodash2.default.isString(modelConfig.collection)) {
		collectionName = modelConfig.collection;
	}
	/*
  * Check modelConfig's model parameter
  */
	if (_lodash2.default.has(modelConfig, "model") && _lodash2.default.isString(modelConfig.model)) {
		modelName = modelConfig.model;
		//Catch collection name not being set and set it to the model name
		if (modelConfig.collection != collectionName) {
			collectionName = modelName;
		}
	}

	// Set schema
	var Schema = new _mongoose2.default.Schema(schemaObj);
	// Set collection name
	Schema.set('collection', modelConfig.collection);
	// Construct model from `Schema`
	_db2.default.hypercube.model(modelName, Schema);
	// Make model accessible from controllers
	var model = _db2.default.hypercube.model(modelName);
	//Set collection name
	model.collectionName = Schema.get('collection');
	//Export model name
	//TODO: Handle Methods input
	modelConfig.methods = {};
	//TODO: Namespace this output (exports.models?). Also, Why not just return user?
	exports[modelName] = model;
};

var _db = require('./../lib/db');

var _db2 = _interopRequireDefault(_db);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }