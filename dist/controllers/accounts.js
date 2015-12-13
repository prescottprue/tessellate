'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.get = get;
exports.add = add;
exports.update = update;
exports.del = del;
exports.search = search;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _account = require('../models/account');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @api {get} /accounts Get Account(s)
 * @apiDescription Get list of accounts
 * @apiName GetAccount
 * @apiGroup Account
 *
 * @apiParam {Number} id Accounts unique ID.
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John Doe",
 *       "title": "Doe",
 *       "username": "john123",
 *       "email": "john123@gmail.com",
 *       "role":"account",
 *     }
 *
 */
function get(req, res, next) {
	_logger2.default.log({
		message: 'Account(s) get called.',
		func: 'get', obj: 'AccountCtrl'
	});
	var query = _account.Account.find({}, { username: 1, email: 1 });
	if (_lodash2.default.has(req, 'params') && _lodash2.default.has(req.params, "username")) {
		//Get data for a specific account
		_logger2.default.log({
			message: 'Get account called with username.',
			username: req.params.username,
			func: 'get', obj: 'AccountCtrl'
		});
		query = _account.Account.findOne({ username: req.params.username }, { password: 0, __v: 0 });
	}
	query.then(function (accountData) {
		if (!accountData) {
			_logger2.default.log({
				message: 'No account data',
				func: 'get', obj: 'AccountCtrl'
			});
			return res.send(400).send('Account not found.');
		} else {
			res.send(accountData);
		}
	}, function (err) {
		_logger2.default.error({
			message: 'Error finding account data.',
			error: err, func: 'get', obj: 'AccountCtrl'
		});
		return res.status(500).send('Error getting account.');
	});
} /**
   * @description Account controller functions
   */
;
/**
 * @api {post} /accounts Add Account
 * @apiDescription Add a new account.
 * @apiName AddAccount
 * @apiGroup Account
 *
 * @apiParam {String} username Accountname of account
 * @apiParam {String} email Email of account
 * @apiParam {String} password Password of account
 * @apiParam {String} name Name of account
 * @apiParam {String} title Title of account
 * @apiParam {Boolean} tempPassword Whether or not to set a temporary password (Also set if there is no password param)
 *
 * @apiSuccess {Object} accountData Object containing newly created accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"account",
 *     }
 *
 */
function add(req, res, next) {
	//Query for existing account with same _id
	var query;
	if (!_lodash2.default.has(req.body, "username") && !_lodash2.default.has(req.body, "email")) {
		return res.status(400).json({ code: 400, message: "Accountname or Email required to add a new account" });
	}
	if (_lodash2.default.has(req.body, "username")) {
		query = _account.Account.findOne({ "username": req.body.username }); // find using username field
	} else {
			query = _account.Account.findOne({ "email": req.body.email }); // find using email field
		}
	query.then(function () {
		var account = new _account.Account(req.body);
		account.saveNew().then(function (newAccount) {
			//TODO: Set temporary password
			res.json(newAccount);
		}, function (err) {
			_logger2.default.error({ description: 'Error creating new account.', error: err, func: 'add', obj: 'AccountsCtrl' });
			res.status(500).send('Account could not be added.');
		});
	}, function (err) {
		//next() //Pass error on
		_logger2.default.error({ description: 'Error creating new account.', error: err, func: 'add', obj: 'AccountsCtrl' });
		res.status(500).send('Account could not be added.');
	});
};
/**
 * @api {put} /accounts Update Account
 * @apiDescription Update a account.
 * @apiName UpdateAccount
 * @apiGroup Account
 *
 * @apiParam {String} username Email of account
 * @apiParam {String} password Password of account
 * @apiParam {String} name Name of account
 * @apiParam {String} title Title of account
 * @apiParam {String} role Role of account (admin, account)
 *
 * @apiSuccess {Object} accountData Object containing updated accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"account",
 *     }
 *
 */
function update(req, res, next) {
	_logger2.default.log({ description: 'Update account called.', body: req.body, params: req.params });
	if (_lodash2.default.has(req.params, "username")) {
		_account.Account.findOne({ username: req.params.username }, function (err, account) {
			if (err) {
				_logger2.default.error({ description: 'Error finding account.', username: req.params.username, error: err, func: 'update', obj: 'AccountsCtrl' });
				res.status(500).send('Error finding account.');
			} else if (!account) {
				res.status(400).send('Account not found.');
			} else {
				//Select only valid parameters
				var updateData = _lodash2.default.pick(req.body, ['username', 'email', 'name', 'frontend', 'backend', 'groups', 'sessionId', 'password']);
				//Apply each updated value to account.
				_lodash2.default.each(_lodash2.default.keys(updateData), function (key) {
					account[key] = updateData[key];
				});
				_logger2.default.log('account before save:', account);
				account.saveNew().then(function (savedAccount) {
					_logger2.default.log({ description: 'Account saved successfully.' });
					res.json(savedAccount);
				}, function (err) {
					_logger2.default.error({ description: 'Error saving account.', error: err, func: 'update', obj: 'AccountsCtrl' });
					res.status(500).send('Error updating account.');
				});
			}
		});
		// Account.update({username:req.params.username}, req.body, {upsert:false},  (err, numberAffected, result)  => {
		// 	if (err) { return next(err); }
		// 	//TODO: respond with updated data instead of passing through req.body
		// 	res.json(req.body);
		// });
	} else {
			res.status(400).send({ message: 'Account username is required to update.' });
		}
};
/**
 * @api {delete} /account/:id Delete Account
 * @apiDescription Delete a account.
 * @apiName DeleteAccount
 * @apiGroup Account
 *
 * @apiParam {String} username Email of account
 *
 * @apiSuccess {Object} accountData Object containing deleted accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"account",
 *     }
 *
 */
function del(req, res, next) {
	// var urlParams = url.parse(req.url, true).query;
	if (_lodash2.default.has(req.params, "username")) {
		var query = _account.Account.findOneAndRemove({ 'username': req.params.username }); // find and delete using id field
		query.then(function (result) {
			_logger2.default.log('Account deleted successfully:');
			res.json(result);
		}, function (err) {
			_logger2.default.error('Account could not be deleted:', err);
			res.status(500).send({ message: 'Account cound not be deleted' });
		});
	}
};
/**
 * @api {get} /account/:id Search Accounts
 * @apiDescription Search Accounts.
 * @apiName SearchAccount
 * @apiGroup Account
 *
 * @apiParam {String} searchQuery String to search through accounts with
 *
 * @apiSuccess {Object} accountData Object containing deleted accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id":"189B7NV89374N4839"
 *       "name": "John",
 *       "title": "Doe",
 *       "role":"account",
 *     }
 *
 */
function search(req, res, next) {
	// var urlParams = url.parse(req.url, true).query;
	var usernameQuery = createAccountQuery('username', req.params.searchQuery);
	var emailQuery = createAccountQuery('email', req.params.searchQuery);
	//Search usernames
	usernameQuery.then(function (usernameResults) {
		if (_lodash2.default.isArray(usernameResults) && usernameResults.length == 0) {
			//Search emails
			emailQuery.then(function (emailResults) {
				_logger2.default.log('Account search by email resulted:', emailResults);
				res.json(emailResults);
			}, function (err) {
				res.status(500).send({ message: 'Account cound not be found' });
			});
		} else {
			_logger2.default.log('Account search by username resulted:', usernameResults);
			res.json(usernameResults);
		}
	}, function (err) {
		_logger2.default.error({ description: 'Error searching for account.', error: err, func: 'search', obj: 'AccountsCtrls' });
		res.status(500).send({ message: 'Account cound not be found' });
	});
};
/**
 * Create a account query based on provided key and value
 */
function createAccountQuery(key, val) {
	var queryArr = _lodash2.default.map(val.split(' '), function (qr) {
		var queryObj = {};
		queryObj[key] = new RegExp(_lodash2.default.escapeRegExp(qr), 'i');
		return queryObj;
	});
	var find = { $or: queryArr };
	return _account.Account.find(find, { email: 1, name: 1, username: 1 }); // find and delete using id field
}