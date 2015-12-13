'use strict';

var _db = require('./../utils/db');

var _db2 = _interopRequireDefault(_db);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _application = require('./application');

var _account = require('./account');

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GroupSchema = new _mongoose2.default.Schema({
	application: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Application' },
	name: { type: String, default: '' },
	accounts: [{ type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Account' }],
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
	addAccount: function addAccount(account) {
		//TODO: Handle adding an account to the group
		this.save().then(function (newAccount) {
			return newAccount;
		}, function (err) {
			_logger2.default.error('Error', err);
		});
	},
	findAccount: function findAccount(accountData) {
		//TODO: Find by parameters other than username
		if (!accountData || !_underscore2.default.has(accountData, 'username')) {
			_logger2.default.error({
				description: 'Username required to find account.', func: 'findAccount', obj: 'Group'
			});
			return Promise.reject({ message: 'Account not found.' });
		}
		_logger2.default.log({
			description: 'Account data.', accountData: accountData
		});
		var aq = this.model('Account').findOne({ username: accountData.username }).populate({ path: 'groups', select: 'name accounts' }).select({ password: 0 });
		// d.resolve(account);
		return aq.then(function (result) {
			if (!result) {
				_logger2.default.error({
					description: 'Error finding account.'
				});
				return Promise.reject(null);
			}
			_logger2.default.log({
				description: 'directory returned:', result: result, func: 'findAccount', obj: 'Group'
			});
			return result;
		}, function (err) {
			_logger2.default.error({
				description: 'Error getting account.', error: err, func: 'findAccount', obj: 'Group'
			});
			return Promise.reject(err);
		});
	}
};
/*
 * Construct `Account` model from `AccountSchema`
 */
_db2.default.tessellate.model('Group', GroupSchema);

/*
 * Make model accessible from controllers
 */
var Group = _db2.default.tessellate.model('Group');
Group.collectionName = GroupSchema.get('collection');

exports.Group = _db2.default.tessellate.model('Group');