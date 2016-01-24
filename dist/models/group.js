'use strict';

var _db = require('./../utils/db');

var _db2 = _interopRequireDefault(_db);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _project = require('./project');

var _user = require('./user');

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GroupSchema = new _mongoose2.default.Schema({
	project: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Project' },
	name: { type: String, default: '' },
	users: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'User' }],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now, index: true }
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
	addUser: function addUser(user) {
		//TODO: Handle adding an user to the group
		this.save().then(function (newUser) {
			return newUser;
		}, function (err) {
			_logger2.default.error('Error', err);
		});
	},
	findUser: function findUser(userData) {
		//TODO: Find by parameters other than username
		if (!userData || !_underscore2.default.has(userData, 'username')) {
			_logger2.default.error({
				description: 'Username required to find user.', func: 'findUser', obj: 'Group'
			});
			return Promise.reject({ message: 'User not found.' });
		}
		_logger2.default.log({
			description: 'User data.', userData: userData
		});
		var aq = this.model('User').findOne({ username: userData.username }).populate({ path: 'groups', select: 'name users' }).select({ password: 0 });
		// d.resolve(user);
		return aq.then(function (result) {
			if (!result) {
				_logger2.default.error({
					description: 'Error finding user.'
				});
				return Promise.reject(null);
			}
			_logger2.default.log({
				description: 'directory returned:', result: result, func: 'findUser', obj: 'Group'
			});
			return result;
		}, function (err) {
			_logger2.default.error({
				description: 'Error getting user.', error: err, func: 'findUser', obj: 'Group'
			});
			return Promise.reject(err);
		});
	}
};
/*
 * Construct `User` model from `UserSchema`
 */
_db2.default.tessellate.model('Group', GroupSchema);

/*
 * Make model accessible from controllers
 */
var Group = _db2.default.tessellate.model('Group');
Group.collectionName = GroupSchema.get('collection');

exports.Group = _db2.default.tessellate.model('Group');