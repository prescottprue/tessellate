var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('jwt-decode'), require('superagent'), require('aws-sdk'), require('firebase')) : typeof define === 'function' && define.amd ? define(['lodash', 'jwt-decode', 'superagent', 'aws-sdk', 'firebase'], factory) : global.Grout = factory(global._, global.jwtDecode, global.superagent, global.AWS, global.Firebase);
})(this, function (_, jwtDecode, superagent, AWS, Firebase) {
	'use strict';

	_ = 'default' in _ ? _['default'] : _;
	jwtDecode = 'default' in jwtDecode ? jwtDecode['default'] : jwtDecode;
	superagent = 'default' in superagent ? superagent['default'] : superagent;
	AWS = 'default' in AWS ? AWS['default'] : AWS;
	Firebase = 'default' in Firebase ? Firebase['default'] : Firebase;

	var _config = {
		serverUrl: 'http://tessellate.elasticbeanstalk.com',
		tokenName: 'tessellate',
		tokenDataName: 'tessellate-tokenData',
		tokenUserDataName: 'tessellate-currentUser'
	};

	var ____________logger = {
		log: function log(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'production') {
				runConsoleMethod('log', msgArgs);
			} else {
				runConsoleMethod('log', msgArgs);
			}
		},
		info: function info(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'production') {
				runConsoleMethod('info', msgArgs);
			} else {
				runConsoleMethod('info', msgArgs);
			}
		},
		warn: function warn(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'production') {
				runConsoleMethod('warn', msgArgs);
			} else {
				runConsoleMethod('warn', msgArgs);
			}
		},
		debug: function debug(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'production') {
				// runConsoleMethod('debug', msgArgs);
				//Do not display console debugs in production
			} else {
					runConsoleMethod('debug', msgArgs);
				}
		},
		error: function error(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'production') {
				//TODO: Log to external logger
				runConsoleMethod('error', msgArgs);
			} else {
				runConsoleMethod('error', msgArgs);
			}
		}
	};

	function runConsoleMethod(methodName, methodData) {
		//Safley run console methods or use console log
		if (methodName && console[methodName]) {
			return console[methodName].apply(console, methodData);
		} else {
			return console.log.apply(console, methodData);
		}
	}
	function buildMessageArgs(logData) {
		var msgStr = '';
		var msgObj = {};
		//TODO: Attach time stamp
		if (_.isObject(logData)) {
			if (_.has(logData, 'func')) {
				if (_.has(logData, 'obj')) {
					msgStr += '[' + logData.obj + '.' + logData.func + '()] ';
				} else if (_.has(logData, 'file')) {
					msgStr += '[' + logData.file + ' > ' + logData.func + '()] ';
				} else {
					msgStr += '[' + logData.func + '()] ';
				}
			}
			//Print each key and its value other than obj and func
			_.each(_.omit(_.keys(logData)), function (key, ind, list) {
				if (key != 'func' && key != 'obj') {
					if (key == 'description' || key == 'message') {
						msgStr += logData[key];
					} else if (_.isString(logData[key])) {
						// msgStr += key + ': ' + logData[key] + ', ';
						msgObj[key] = logData[key];
					} else {
						//Print objects differently
						// msgStr += key + ': ' + logData[key] + ', ';
						msgObj[key] = logData[key];
					}
				}
			});
			msgStr += '\n';
		} else if (_.isString(logData)) {
			msgStr = logData;
		}
		var msg = [msgStr, msgObj];

		return msg;
	}

	var data = {};
	var storage = Object.defineProperties({
		/**
   * @description
   * Safley sets item to session storage.
   *
   * @param {String} itemName The items name
   * @param {String} itemValue The items value
   *
   */
		item: function item(itemName, itemValue) {
			return this.setItem(itemName, itemValue);
		},
		/**
   * @description
   * Safley sets item to session storage. Alias: item()
   *
   * @param {String} itemName The items name
   * @param {String} itemValue The items value
   *
   */
		setItem: function setItem(itemName, itemValue) {
			data[itemName] = itemValue;
			if (this.localExists) {
				//Convert object to string
				if (_.isObject(itemValue)) {
					itemValue = JSON.stringify(itemValue);
				}
				window.sessionStorage.setItem(itemName, itemValue);
			}
		},

		/**
   * @description
   * Safley gets an item from session storage. Alias: item()
   *
   * @param {String} itemName The items name
   *
   * @return {String}
   *
   */
		getItem: function getItem(itemName) {
			if (data[itemName]) {
				return data[itemName];
			} else if (this.localExists) {
				var itemStr = window.sessionStorage.getItem(itemName);
				//Check that str is not null before parsing
				if (itemStr) {
					var isObj = false;
					var itemObj = null;
					//Try parsing to object
					try {
						itemObj = JSON.parse(itemStr);
						isObj = true;
					} catch (err) {
						// logger.log({message: 'String could not be parsed.', error: err, func: 'getItem', obj: 'storage'});
						//Parsing failed, this must just be a string
						isObj = false;
					}
					if (isObj) {
						return itemObj;
					}
				}
				return itemStr;
			} else {
				return null;
			}
		},
		/**
   * @description
   * Safley removes item from session storage.
   *
   * @param {String} itemName - The items name
   *
   */
		removeItem: function removeItem(itemName) {
			//TODO: Only remove used items
			if (data[itemName]) {
				data[itemName] = null;
			}
			if (this.localExists) {
				try {
					//Clear session storage
					window.sessionStorage.removeItem(itemName);
				} catch (err) {
					____________logger.error({ description: 'Error removing item from session storage', error: err, obj: 'storage', func: 'removeItem' });
				}
			}
		},
		/**
   * @description
   * Safley removes item from session storage.
   *
   * @param {String} itemName the items name
   * @param {String} itemValue the items value
   *
   */
		clear: function clear() {
			//TODO: Only remove used items
			data = {};
			if (this.localExists) {
				try {
					//Clear session storage
					window.sessionStorage.clear();
				} catch (err) {
					____________logger.warn('Session storage could not be cleared.', err);
				}
			}
		}

	}, {
		localExists: {
			get: function get() {
				var testKey = 'test';
				if (typeof window != 'undefined' && typeof window.sessionStorage != 'undefined') {
					try {
						window.sessionStorage.setItem(testKey, '1');
						window.sessionStorage.removeItem(testKey);
						return true;
					} catch (err) {
						____________logger.error({ description: 'Error saving to session storage', error: err, obj: 'storage', func: 'localExists' });
						return false;
					}
				} else {
					return false;
				}
			},
			configurable: true,
			enumerable: true
		}
	});

	function decodeToken(tokenStr) {
		var tokenData = undefined;
		if (tokenStr && tokenStr != '') {
			try {
				tokenData = jwtDecode(tokenStr);
			} catch (err) {
				____________logger.error({ description: 'Error decoding token.', data: tokenData, error: err, func: 'decodeToken', file: 'token' });
				throw new Error('Invalid token string.');
			}
		}
		return tokenData;
	}
	var token = Object.defineProperties({
		save: function save(tokenStr) {
			this.string = tokenStr;
		},
		'delete': function _delete() {
			storage.removeItem(_config.tokenName);
			storage.removeItem(_config.tokenDataName);
			____________logger.log({ description: 'Token was removed.', func: 'delete', obj: 'token' });
		}
	}, {
		string: {
			get: function get() {
				return storage.getItem(_config.tokenName);
			},
			set: function set(tokenStr) {
				____________logger.log({ description: 'Token was set.', token: tokenStr, func: 'string', obj: 'token' });
				this.data = jwtDecode(tokenStr);
				storage.setItem(_config.tokenName, tokenStr);
			},
			configurable: true,
			enumerable: true
		},
		data: {
			get: function get() {
				if (storage.getItem(_config.tokenDataName)) {
					return storage.getItem(_config.tokenDataName);
				} else {
					return decodeToken(this.string);
				}
			},
			set: function set(tokenData) {
				if (_.isString(tokenData)) {
					var tokenStr = tokenData;
					tokenData = decodeToken(tokenStr);
					____________logger.info({ description: 'Token data was set as string. Decoding token.', token: tokenStr, tokenData: tokenData, func: 'data', obj: 'token' });
				} else {
					____________logger.log({ description: 'Token data was set.', data: tokenData, func: 'data', obj: 'token' });
					storage.setItem(_config.tokenDataName, tokenData);
				}
			},
			configurable: true,
			enumerable: true
		}
	});

	var ___________request = {
		get: function get(endpoint, queryData) {
			var req = superagent.get(endpoint);
			if (queryData) {
				req.query(queryData);
			}
			req = addAuthHeader(req);
			return handleResponse(req);
		},
		post: function post(endpoint, data) {
			var req = superagent.post(endpoint).send(data);
			req = addAuthHeader(req);
			return handleResponse(req);
		},
		put: function put(endpoint, data) {
			var req = superagent.put(endpoint).send(data);
			req = addAuthHeader(req);
			return handleResponse(req);
		},
		del: function del(endpoint, data) {
			var req = superagent.put(endpoint).send(data);
			req = addAuthHeader(req);
			return handleResponse(req);
		}
	};

	function handleResponse(req) {
		return new Promise(function (resolve, reject) {
			req.end(function (err, res) {
				if (!err) {
					// logger.log({description: 'Response:', response:res, func:'handleResponse', file: 'request'});
					return resolve(res.body);
				} else {
					if (err.status == 401) {
						console.warn('Unauthorized. You must be signed into make this request.');
					}
					return reject(err);
				}
			});
		});
	}
	function addAuthHeader(req) {
		if (token.string) {
			req = req.set('Authorization', 'Bearer ' + token.string);
			console.info({ message: 'Set auth header', func: 'addAuthHeader', file: 'request' });
		}
		return req;
	}

	var Matter = (function () {
		/* Constructor
   * @param {string} appName Name of application
   */

		function Matter(appName, opts) {
			_classCallCheck(this, Matter);

			if (!appName) {
				____________logger.error({ description: 'Application name requires to use Matter.', func: 'constructor', obj: 'Matter' });
				throw new Error('Application name is required to use Matter');
			} else {
				this.name = appName;
			}
			if (opts) {
				this.options = opts;
			}
		}

		/* Endpoint getter
   *
   */

		_createClass(Matter, [{
			key: 'signup',

			/* Signup
    *
    */
			value: function signup(signupData) {
				return ___________request.post(this.endpoint + '/signup', signupData).then(function (response) {
					____________logger.log({ description: 'Account request successful.', signupData: signupData, response: response, func: 'signup', obj: 'Matter' });
					if (_.has(response, 'account')) {
						return response.account;
					} else {
						____________logger.warn({ description: 'Account was not contained in signup response.', signupData: signupData, response: response, func: 'signup', obj: 'Matter' });
						return response;
					}
				})['catch'](function (errRes) {
					____________logger.error({ description: 'Error requesting signup.', signupData: signupData, error: errRes, func: 'signup', obj: 'Matter' });
					return Promise.reject(errRes);
				});
			}

			/** Login
    *
    */
		}, {
			key: 'login',
			value: function login(loginData) {
				var _this = this;

				if (!loginData || !loginData.password || !loginData.username) {
					____________logger.error({ description: 'Username/Email and Password are required to login', func: 'login', obj: 'Matter' });
					return Promise.reject({ message: 'Username/Email and Password are required to login' });
				}
				return ___________request.put(this.endpoint + '/login', loginData).then(function (response) {
					if (_.has(response, 'data') && _.has(response.data, 'status') && response.data.status == 409) {
						____________logger.warn({ description: 'Account not found.', response: response, func: 'login', obj: 'Matter' });
						return Promise.reject(response.data);
					} else {
						____________logger.log({ description: 'Successful login.', response: response, func: 'login', obj: 'Matter' });
						if (_.has(response, 'token')) {
							_this.token.string = response.token;
						}
						if (_.has(response, 'account')) {
							_this.storage.setItem(_config.tokenUserDataName, response.account);
						}
						return response.account;
					}
				})['catch'](function (errRes) {
					____________logger.error({ description: 'Error requesting login.', error: errRes, status: errRes.status, func: 'login', obj: 'Matter' });
					if (errRes.status == 409 || errRes.status == 400) {
						errRes = errRes.response.text;
					}
					return Promise.reject(errRes);
				});
			}

			/** Logout
    */
		}, {
			key: 'logout',
			value: function logout() {
				var _this2 = this;

				return ___________request.put(this.endpoint + '/logout').then(function (response) {
					____________logger.log({ description: 'Logout successful.', response: response, func: 'logout', obj: 'Matter' });
					_this2.currentUser = null;
					_this2.token['delete']();
					return response;
				})['catch'](function (errRes) {
					____________logger.error({ description: 'Error requesting log out: ', error: errRes, func: 'logout', obj: 'Matter' });
					_this2.storage.removeItem(_config.tokenUserDataName);
					_this2.token['delete']();
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'getCurrentUser',
			value: function getCurrentUser() {
				var _this3 = this;

				if (this.storage.item(_config.tokenUserDataName)) {
					return Promise.resove(this.storage.getItem(_config.tokenUserDataName));
				} else {
					if (this.isLoggedIn) {
						return ___________request.get(this.endpoint + '/user').then(function (response) {
							//TODO: Save user information locally
							____________logger.log({ description: 'Current User Request responded.', responseData: response, func: 'currentUser', obj: 'Matter' });
							_this3.currentUser = response;
							return response;
						})['catch'](function (errRes) {
							if (err.status == 401) {
								____________logger.warn({ description: 'Called for current user without token.', error: errRes, func: 'currentUser', obj: 'Matter' });
								return Promise.resolve(null);
							} else {
								____________logger.error({ description: 'Error requesting current user.', error: errRes, func: 'currentUser', obj: 'Matter' });
								return Promise.reject(errRes);
							}
						});
					} else {
						return Promise.resolve(null);
					}
				}
			}
		}, {
			key: 'updateProfile',

			/** updateProfile
    */
			value: function updateProfile(updateData) {
				var _this4 = this;

				if (!this.isLoggedIn) {
					____________logger.error({ description: 'No current user profile to update.', func: 'updateProfile', obj: 'Matter' });
					return Promise.reject({ message: 'Must be logged in to update profile.' });
				}
				//Send update request
				____________logger.warn({ description: 'Calling update endpoint.', endpoint: this.endpoint + '/user/' + this.token.data.username, func: 'updateProfile', obj: 'Matter' });
				return ___________request.put(this.endpoint + '/user/' + this.token.data.username, updateData).then(function (response) {
					____________logger.log({ description: 'Update profile request responded.', responseData: response, func: 'updateProfile', obj: 'Matter' });
					_this4.currentUser = response;
					return response;
				})['catch'](function (errRes) {
					____________logger.error({ description: 'Error requesting current user.', error: errRes, func: 'updateProfile', obj: 'Matter' });
					return Promise.reject(errRes);
				});
			}

			/** updateProfile
    */
		}, {
			key: 'isInGroup',

			//Check that user is in a single group or in all of a list of groups
			value: function isInGroup(checkGroups) {
				var _this5 = this;

				if (!this.isLoggedIn) {
					____________logger.log({ description: 'No logged in user to check.', func: 'isInGroup', obj: 'Matter' });
					return false;
				}
				//Check if user is
				if (checkGroups && _.isString(checkGroups)) {
					var _ret = (function () {
						var groupName = checkGroups;
						//Single role or string list of roles
						var groupsArray = groupName.split(',');
						if (groupsArray.length > 1) {
							//String list of groupts
							____________logger.info({ description: 'String list of groups.', list: groupsArray, func: 'isInGroup', obj: 'Matter' });
							return {
								v: _this5.isInGroups(groupsArray)
							};
						} else {
							//Single group
							var groups = _this5.token.data.groups || [];
							____________logger.log({ description: 'Checking if user is in group.', group: groupName, userGroups: _this5.token.data.groups || [], func: 'isInGroup', obj: 'Matter' });
							return {
								v: _.any(groups, function (group) {
									return groupName == group.name;
								})
							};
						}
					})();

					if (typeof _ret === 'object') return _ret.v;
				} else if (checkGroups && _.isArray(checkGroups)) {
					//Array of roles
					//Check that user is in every group
					____________logger.info({ description: 'Array of groups.', list: checkGroups, func: 'isInGroup', obj: 'Matter' });
					return this.isInGroups(checkGroups);
				} else {
					return false;
				}
				//TODO: Handle string and array inputs
			}
		}, {
			key: 'isInGroups',
			value: function isInGroups(checkGroups) {
				var _this6 = this;

				//Check if user is in any of the provided groups
				if (checkGroups && _.isArray(checkGroups)) {
					return _.map(checkGroups, function (group) {
						if (_.isString(group)) {
							//Group is string
							return _this6.isInGroup(group);
						} else {
							//Group is object
							return _this6.isInGroup(group.name);
						}
					});
				} else if (checkGroups && _.isString(checkGroups)) {
					//TODO: Handle spaces within string list
					var groupsArray = checkGroups.split(',');
					if (groupsArray.length > 1) {
						return this.isInGroups(groupsArray);
					}
					return this.isInGroup(groupsArray[0]);
				} else {
					____________logger.error({ description: 'Invalid groups list.', func: 'isInGroups', obj: 'Matter' });
				}
			}
		}, {
			key: 'endpoint',
			get: function get() {
				var serverUrl = _config.serverUrl;
				if (_.has(this, 'options') && this.options.localServer) {
					serverUrl = 'http://localhost:4000';
					____________logger.info({ description: 'LocalServer option was set to true. Now server url is local server.', url: serverUrl, func: 'endpoint', obj: 'Matter' });
				}
				if (this.name == 'tessellate') {
					//Remove url if host is server
					if (window && _.has(window, 'location') && window.location.host == serverUrl) {
						serverUrl = '';
						____________logger.info({ description: 'Host is Server, serverUrl simplified!', url: serverUrl, func: 'endpoint', obj: 'Matter' });
					}
				} else {
					serverUrl = _config.serverUrl + '/apps/' + this.name;
					____________logger.info({ description: 'Server url set.', url: serverUrl, func: 'endpoint', obj: 'Matter' });
				}
				return serverUrl;
			}
		}, {
			key: 'currentUser',
			set: function set(userData) {
				____________logger.log({ description: 'Current User set.', user: userData, func: 'currentUser', obj: 'Matter' });
				this.storage.setItem(_config.tokenUserDataName, userData);
			},
			get: function get() {
				if (this.storage.getItem(_config.tokenUserDataName)) {
					return this.storage.getItem(_config.tokenUserDataName);
				} else {
					return null;
				}
			}
		}, {
			key: 'storage',
			get: function get() {
				return storage;
			}

			/** updateProfile
    */
		}, {
			key: 'token',
			get: function get() {
				return token;
			}
		}, {
			key: 'utils',
			get: function get() {
				return { logger: ____________logger, request: ___________request, storage: storage };
			}
		}, {
			key: 'isLoggedIn',
			get: function get() {
				return this.token.string ? true : false;
			}
		}]);

		return Matter;
	})();

	var config = {
		serverUrl: 'http://tessellate.elasticbeanstalk.com',
		tokenName: 'grout',
		fbUrl: 'https://pruvit.firebaseio.com/',
		appName: 'tessellate',
		matterOptions: {
			localServer: true
		},
		aws: {
			region: 'us-east-1',
			cognito: {
				poolId: 'us-east-1:72a20ffd-c638-48b0-b234-3312b3e64b2e',
				params: {
					AuthRoleArn: 'arn:aws:iam::823322155619:role/Cognito_TessellateUnauth_Role',
					UnauthRoleArn: 'arn:aws:iam::823322155619:role/Cognito_TessellateAuth_Role'
				}
			}
		}
	};

	var matter = new Matter(config.appName, config.matterOptions);

	var __________request = matter.utils.request;
	var ___________logger = matter.utils.logger;

	//Actions for specific directory

	var Directory = (function () {
		function Directory(actionData) {
			_classCallCheck(this, Directory);

			if (actionData && _.isObject(actionData) && (_.has(actionData, 'directoryName') || _.has(actionData, 'name'))) {
				//Data is object containing directory data
				this.name = actionData.directoryName || actionData.name;
				if (_.has(actionData, 'appName')) {
					this.appName = actionData.appName;
				}
			} else if (actionData && _.isString(actionData)) {
				//Data is string name
				this.name = actionData;
			} else {
				___________logger.error({ description: 'Action data object with name is required to start a Directory Action.', func: 'constructor', obj: 'Directory' });
				throw new Error('Directory Data object with name is required to start a Directory action.');
			}
		}

		_createClass(Directory, [{
			key: 'get',

			//Get userlications or single userlication
			value: function get() {
				return __________request.get(this.directoryEndpoint).then(function (response) {
					___________logger.info({ description: 'Directory data loaded successfully.', directoryData: directoryData, response: response, func: 'get', obj: 'Directory' });
					return response;
				})['catch'](function (errRes) {
					___________logger.info({ description: 'Error getting directory.', directoryData: directoryData, error: errRes, func: 'get', obj: 'Directory' });
					return Promise.reject(errRes);
				});
			}

			//Update an Directory
		}, {
			key: 'update',
			value: function update(directoryData) {
				___________logger.debug({ description: 'Directory updated called.', directoryData: directoryData, func: 'update', obj: 'Directory' });
				return matter.utils.request.put(this.directoryEndpoint, directoryData).then(function (response) {
					___________logger.info({ description: 'Directory updated successfully.', directoryData: directoryData, response: response, func: 'update', obj: 'Directory' });
					return response;
				})['catch'](function (errRes) {
					___________logger.error({ description: 'Error updating directory.', directoryData: directoryData, error: errRes, func: 'update', obj: 'Directory' });
					return Promise.reject(errRes);
				});
			}

			//Delete an Directory
		}, {
			key: 'del',
			value: function del(directoryData) {
				___________logger.debug({ description: 'Delete directory called.', directoryData: directoryData, func: 'del', obj: 'Directory' });
				return __________request['delete'](this.directoryEndpoint, userData).then(function (response) {
					___________logger.info({ description: 'Directory deleted successfully.', directoryData: directoryData, func: 'del', obj: 'Directory' });
					return response;
				})['catch'](function (errRes) {
					___________logger.error({ description: 'Error deleting directory.', directoryData: directoryData, error: errRes, func: 'del', obj: 'Directory' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'directoryEndpoint',
			get: function get() {
				var endpointArray = [matter.endpoint, 'directories', this.name];
				//Check for app account action
				if (_.has(this, 'app') && _.has(this.app, 'name')) {
					endpointArray.splice(1, 0, 'apps', this.app.name);
				}
				//Create string from endpointArray
				var endpointStr = endpointArray.join('/');
				___________logger.log({ description: 'Directory endpoint built.', endpoint: endpointStr, func: 'directoryEndpoint', obj: 'Directory' });
				return endpointStr;
			}
		}]);

		return Directory;
	})();

	var _________request = matter.utils.request;
	var __________logger = matter.utils.logger;

	//Actions for specific user

	var Group = (function () {
		function Group(actionData) {
			_classCallCheck(this, Group);

			//Call matter with name and settings
			if (actionData && _.isObject(actionData) && _.has(actionData, 'groupData')) {
				//Data is object containing group data
				this.name = _.isObject(actionData.groupData) ? actionData.groupData.name : actionData.groupData;
				if (_.has(actionData, 'app')) {
					this.app = actionData.app;
				}
			} else if (actionData && _.isString(actionData)) {
				//Data is string name
				this.name = actionData;
			} else {
				__________logger.error({ description: 'Action data is required to start a Group Action.', func: 'constructor', obj: 'Group' });
				throw new Error('Username is required to start an Group');
			}
		}

		_createClass(Group, [{
			key: 'get',

			//Get userlications or single userlication
			value: function get() {
				return _________request.get(this.groupEndpoint).then(function (response) {
					__________logger.info({ description: 'Group data loaded successfully.', response: response, func: 'get', obj: 'Group' });
					return response;
				})['catch'](function (errRes) {
					__________logger.info({ description: 'Error getting group.', error: errRes, func: 'get', obj: 'Group' });
					return Promise.reject(errRes.response.text || errRes.response);
				});
			}

			//Update an Group
		}, {
			key: 'update',
			value: function update(groupData) {
				__________logger.log({ description: 'Group updated called.', groupData: groupData, func: 'update', obj: 'Group' });
				return matter.utils.request.put(this.groupEndpoint, groupData).then(function (response) {
					__________logger.info({ description: 'Group updated successfully.', groupData: groupData, response: response, func: 'update', obj: 'Group' });
					return response;
				})['catch'](function (errRes) {
					__________logger.error({ description: 'Error updating group.', groupData: groupData, error: errRes, func: 'update', obj: 'Group' });
					return Promise.reject(errRes.response.text || errRes.response);
				});
			}

			//Delete an Group
		}, {
			key: 'del',
			value: function del(groupData) {
				__________logger.log({ description: 'Delete group called.', groupData: groupData, func: 'del', obj: 'Group' });
				return _________request.del(this.groupEndpoint, {}).then(function (response) {
					__________logger.info({ description: 'Group deleted successfully.', groupData: groupData, func: 'del', obj: 'Group' });
					return response;
				})['catch'](function (errRes) {
					__________logger.error({ description: 'Error deleting group.', error: errRes, text: errRes.response.text, groupData: groupData, func: 'del', obj: 'Group' });
					return Promise.reject(errRes.response.text || errRes.response);
				});
			}

			//Update an Group
		}, {
			key: 'addAccounts',
			value: function addAccounts(accountsData) {
				__________logger.log({ description: 'Group updated called.', accountsData: accountsData, func: 'update', obj: 'Group' });
				var accountsArray = accountsData;
				//Handle provided data being a string list
				if (_.isString(accountsData)) {
					accountsArray = accountsData.split(',');
				}
				//Check item in array to see if it is a string (username) instead of _id
				if (_.isString(accountsArray[0])) {
					__________logger.error({ description: 'Accounts array only currently supports account._id not account.username.', accountsData: accountsData, func: 'update', obj: 'Group' });
					return Promise.reject({ message: 'Accounts array only currently supports account._id not account.username.' });
				}
				__________logger.log({ description: 'Updating group with accounts array.', accountsArray: accountsArray, func: 'update', obj: 'Group' });
				return this.update({ accounts: accountsArray }).then(function (response) {
					__________logger.info({ description: 'Account(s) added to group successfully.', response: response, func: 'addAccounts', obj: 'Group' });
					return response;
				})['catch'](function (errRes) {
					__________logger.error({ description: 'Error addAccountseting group.', error: errRes, func: 'addAccounts', obj: 'Group' });
					return Promise.reject(errRes.response.text || errRes.response);
				});
			}
		}, {
			key: 'groupEndpoint',
			get: function get() {
				var endpointArray = [matter.endpoint, 'groups', this.name];
				//Check for app account action

				if (_.has(this, 'app') && _.has(this.app, 'name')) {
					endpointArray.splice(1, 0, 'apps', this.app.name);
				}
				//Create string from endpointArray
				var endpointStr = endpointArray.join('/');
				__________logger.log({ description: 'Group Endpoint built.', endpoint: endpointStr, func: 'groupEndpoint', obj: 'Group' });
				return endpointStr;
			}
		}]);

		return Group;
	})();

	var ________request = matter.utils.request;
	var _________logger = matter.utils.logger;

	//Actions for users list

	var GroupsAction = (function () {
		function GroupsAction(actionData) {
			_classCallCheck(this, GroupsAction);

			//Check to see if action is for a specific app
			if (actionData && _.isObject(actionData) && _.has(actionData, 'app')) {
				this.app = actionData.app;
				_________logger.log({ description: 'Provided app data set to app parameter.', action: this, providedData: actionData, func: 'constructor', obj: 'GroupsAction' });
			} else if (actionData && _.isString(actionData)) {
				this.app = { name: actionData };
				_________logger.log({ description: 'App name provided as string was set.', action: this, providedData: actionData, func: 'constructor', obj: 'GroupsAction' });
			} else {
				_________logger.error({ description: 'Error creating new Groups action.', action: this, providedData: actionData, func: 'constructor', obj: 'GroupsAction' });
			}
		}

		_createClass(GroupsAction, [{
			key: 'get',

			//Get users or single application
			value: function get() {
				_________logger.debug({ description: 'Get group called.', func: 'get', obj: 'GroupsAction' });
				return ________request.get(this.groupsEndpoint).then(function (response) {
					_________logger.info({ description: 'Groups loaded successfully.', response: response, func: 'get', obj: 'GroupsAction' });
					return response;
				})['catch'](function (errRes) {
					_________logger.info({ description: 'Error getting groups.', error: errRes, func: 'get', obj: 'GroupsAction' });
					return Promise.reject(errRes);
				});
			}

			//Add an application
		}, {
			key: 'add',
			value: function add(groupData) {
				var newGroupData = groupData;
				_________logger.debug({ description: 'Add group called.', groupData: groupData, func: 'add', obj: 'GroupsAction' });
				if (_.isString(groupData)) {
					//Group data is string
					newGroupData = { name: groupData };
				}
				_________logger.debug({ description: 'Add group called.', newGroupData: newGroupData, func: 'add', obj: 'GroupsAction' });
				return ________request.post(this.groupsEndpoint, newGroupData).then(function (response) {
					_________logger.log({ description: 'Group added to application successfully.', response: response, func: 'add', obj: 'GroupsAction' });
					//TODO: Return list of group objects
					return response;
				})['catch'](function (errRes) {
					_________logger.error({ description: 'Error adding group.', error: errRes, func: 'add', obj: 'GroupsAction' });
					return Promise.reject(errRes);
				});
			}

			//Search with partial of username
		}, {
			key: 'search',
			value: function search(query) {
				_________logger.debug({ description: 'Add group called.', groupData: groupData, func: 'search', obj: 'GroupsAction' });
				if (!query || query == '' || !_.isString(query)) {
					_________logger.log({ description: 'Null or invalid query, returning empty array.', func: 'search', obj: 'GroupsAction' });
					return Promise.resolve([]);
				}
				var searchEndpoint = this.groupsEndpoint + '/search/' + query;
				_________logger.debug({ description: 'Search endpoint created.', endpoint: searchEndpoint, func: 'search', obj: 'GroupsAction' });
				return ________request.get(searchEndpoint).then(function (response) {
					_________logger.log({ description: 'Found groups based on search.', response: response, func: 'search', obj: 'GroupsAction' });
					return response;
				})['catch'](function (errRes) {
					_________logger.error({ description: 'Error searching groups.', error: errRes, func: 'search', obj: 'GroupsAction' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'groupsEndpoint',
			get: function get() {
				var endpointArray = [matter.endpoint, 'groups'];
				//Check for app groups action
				if (_.has(this, 'app') && _.has(this.app, 'name')) {
					endpointArray = endpointArray.splice(1, 0, 'apps', this.app.name);
				}
				//Create string from endpointArray
				var endpointStr = endpointArray.join('/');
				_________logger.log({ description: 'Groups Endpoint built.', endpoint: endpointStr, func: 'groupsEndpoint', obj: 'GroupsAction' });
				return endpointStr;
			}
		}]);

		return GroupsAction;
	})();

	var _______request = matter.utils.request;
	var ________logger = matter.utils.logger;

	//Actions for specific user

	var Account = (function () {
		function Account(accountData) {
			_classCallCheck(this, Account);

			//Call matter with name and settings
			if (accountData && _.isObject(accountData) && _.has(accountData, 'username')) {
				_.extend(this, accountData);
			} else if (accountData && _.isString(accountData)) {
				this.username = accountData;
			} else {
				________logger.error({ description: 'AccountData is required to start an AccountAction', func: 'constructor', obj: 'Account' });
				throw new Error('username is required to start an AccountAction');
			}
		}

		//Build endpoint based on accountData

		_createClass(Account, [{
			key: 'get',

			//Get a user
			value: function get() {
				________logger.debug({ description: 'Account data loaded successfully.', func: 'get', obj: 'Account' });
				return _______request.get(this.accountEndpoint).then(function (response) {
					________logger.info({ description: 'Account data loaded successfully.', response: response, func: 'get', obj: 'Account' });
					return new Account(response);
				})['catch'](function (errRes) {
					________logger.error({ description: 'Error getting user.', error: errRes, func: 'get', obj: 'Account' });
					return Promise.reject(errRes);
				});
			}

			//Update a Account
		}, {
			key: 'update',
			value: function update(accountData) {
				________logger.debug({ description: 'Update user called.', accountData: accountData, func: 'update', obj: 'Account' });
				return _______request.put(this.accountEndpoint, accountData).then(function (response) {
					________logger.info({ description: 'Account updated successfully.', func: 'update', obj: 'Account' });
					//TODO: Extend this with current info before returning
					return new Account(response);
				})['catch'](function (errRes) {
					________logger.error({ description: 'Error updating user.', func: 'update', obj: 'Account' });
					return Promise.reject(errRes);
				});
			}

			//Delete a Account
		}, {
			key: 'del',
			value: function del(accountData) {
				________logger.debug({ description: 'Delete user called.', func: 'del', obj: 'Account' });
				return _______request['delete'](this.accountEndpoint, accountData).then(function (response) {
					________logger.info({ description: 'Delete user successful.', response: response, func: 'del', obj: 'Account' });
					return new Account(response);
				})['catch'](function (errRes) {
					________logger.error({ description: 'Error deleting user.', accountData: accountData, error: errRes, func: 'del', obj: 'Account' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'accountEndpoint',
			get: function get() {
				var endpointArray = [matter.endpoint, 'users', this.username];
				//Check for app account action
				if (_.has(this, 'app') && _.has(this.app, 'name')) {
					endpointArray.splice(1, 0, 'apps', this.app.name);
				}
				//Create string from endpointArray
				var endpointStr = endpointArray.join('/');
				________logger.log({ description: 'Account Endpoint built.', endpoint: endpointStr, func: 'accountEndpoint', obj: 'Account' });
				return endpointStr;
			}
		}]);

		return Account;
	})();

	var _______logger = matter.utils.logger;
	//Actions for accounts list

	var AccountsAction = (function () {
		function AccountsAction(actionData) {
			_classCallCheck(this, AccountsAction);

			//Check to see if action is for a specific app
			if (actionData && _.isObject(actionData) && _.has(actionData, 'app')) {
				this.app = actionData.app;
				_______logger.log({ description: 'Provided app data set to app parameter.', action: this, providedData: actionData, func: 'constructor', obj: 'AccountsAction' });
			} else if (actionData && _.isString(actionData)) {
				this.app = { name: actionData };
				_______logger.log({ description: 'App name provided as string was set.', action: this, providedData: actionData, func: 'constructor', obj: 'AccountsAction' });
			} else {
				_______logger.log({ description: 'New Accounts action.', action: this, providedData: actionData, func: 'constructor', obj: 'AccountsAction' });
			}
		}

		_createClass(AccountsAction, [{
			key: 'get',

			//Get accounts or single application
			value: function get() {
				_______logger.log({ description: 'Accounts get called.', func: 'get', obj: 'AccountsAction' });
				return matter.utils.request.get(this.accountsEndpoint).then(function (response) {
					_______logger.info({ description: 'Accounts loaded successfully.', func: 'get', obj: 'AccountsAction' });
					return response;
				})['catch'](function (errRes) {
					_______logger.info({ description: 'Error getting accounts.', error: errRes, func: 'get', obj: 'AccountsAction' });
					return Promise.reject(errRes.message || 'Error getting accounts.');
				});
			}

			//Add an application
		}, {
			key: 'add',
			value: function add(accountData) {
				_______logger.info({ description: 'Account add called.', accountData: accountData, func: 'add', obj: 'AccountsAction' });
				return this.utils.request.post(this.accountsEndpoint, accountData).then(function (response) {
					_______logger.info({ description: 'Account added successfully.', response: response, newAccount: new Account(response), func: 'add', obj: 'AccountsAction' });
					return new Account(response);
				})['catch'](function (errRes) {
					_______logger.error({ description: 'Account add called.', error: errRes, accountData: accountData, func: 'add', obj: 'AccountsAction' });
					return Promise.reject(errRes.message || 'Error adding account.');
				});
			}

			//Search with partial of accountname
		}, {
			key: 'search',
			value: function search(query) {
				_______logger.log({ description: 'Accounts search called.', query: query, func: 'search', obj: 'AccountsAction' });
				var searchEndpoint = this.accountsEndpoint + '/search/';
				if (query && _.isString(query)) {
					searchEndpoint += query;
				}
				if (!query || query == '') {
					_______logger.log({ description: 'Null query, returning empty array.', func: 'search', obj: 'AccountsAction' });
					return Promise.resolve([]);
				}
				return matter.utils.request.get(searchEndpoint).then(function (response) {
					_______logger.log({ description: 'Accounts search responded.', response: response, query: query, func: 'search', obj: 'AccountsAction' });
					return response;
				})['catch'](function (errRes) {
					_______logger.error({ description: 'Error searching Accounts.', error: errRes, query: query, func: 'search', obj: 'AccountsAction' });
					return Promise.reject(errRes.message || 'Error searching accounts.');
				});
			}
		}, {
			key: 'accountsEndpoint',
			get: function get() {
				var endpointArray = [matter.endpoint, 'accounts'];
				//Check for app account action
				if (_.has(this, 'app') && _.has(this.app, 'name')) {
					//Splice apps, appName into index 1
					endpointArray.splice(1, 0, 'apps', this.app.name);
				}
				//Create string from endpointArray
				var endpointStr = endpointArray.join('/');
				_______logger.log({ description: 'Accounts Endpoint built.', endpoint: endpointStr, func: 'accountsEndpoint', obj: 'AccountsAction' });
				return endpointStr;
			}
		}]);

		return AccountsAction;
	})();

	var ______request = matter.utils.request;
	var ______logger = matter.utils.logger;
	//Actions for specific user

	var Template = (function () {
		function Template(templateData) {
			_classCallCheck(this, Template);

			//Call matter with name and settings
			if (templateData && _.isString(templateData)) {
				this.name = templateData;
			} else {
				______logger.error({ description: 'Template data is required to start a Template action.', func: 'construcotr', obj: '' });
				throw new Error('Template data is required to start a Template action.');
			}
		}

		_createClass(Template, [{
			key: 'get',

			//Get userlications or single userlication
			value: function get() {
				______logger.log({ description: 'Get template called.', name: this.name, func: 'get', obj: 'Template' });
				return ______request.get(this.templateEndpoint).then(function (response) {
					______logger.log({ description: 'Get template responded.', response: response, func: 'get', obj: 'Template' });
					return response;
				})['catch'](function (errRes) {
					______logger.error({ description: 'Error getting template.', error: errRes, func: 'get', obj: 'Template' });
					return Promise.reject(errRes);
				});
			}

			//Update an userlication
		}, {
			key: 'update',
			value: function update(templateData) {
				______logger.log({ description: 'Update template called.', templateData: templateData, func: 'update', obj: 'Template' });
				return ______request.put(this.templateEndpoint, templateData).then(function (response) {
					______logger.log({ description: 'Update template responded.', response: response, templateData: templateData, func: 'update', obj: 'Template' });
					//TODO: Return template object
					return response;
				})['catch'](function (errRes) {
					______logger.error({ description: 'Error updating template.', error: errRes, func: 'update', obj: 'Template' });
					return Promise.reject(errRes);
				});
			}

			//Delete a template
		}, {
			key: 'del',
			value: function del(templateData) {
				______logger.log({ description: 'Delete template called.', templateData: templateData, func: 'del', obj: 'Template' });
				return ______request['delete'](this.endpoint, templateData).then(function (response) {
					______logger.log({ description: 'Template deleted successfully.', response: response, func: 'del', obj: 'Template' });
					//TODO: Return template object
					return response;
				})['catch'](function (errRes) {
					______logger.error({ description: 'Error deleting template.', error: errRes, func: 'del', obj: 'Template' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'templateEndpoint',
			get: function get() {
				return matter.endpoint + '/templates/' + this.name;
			}
		}]);

		return Template;
	})();

	var _____logger = matter.utils.logger;
	var _____request = matter.utils.request;

	//Actions for templates list

	var TemplatesAction = (function () {
		function TemplatesAction() {
			_classCallCheck(this, TemplatesAction);
		}

		_createClass(TemplatesAction, [{
			key: 'get',

			//Get templates or single application
			value: function get() {
				_____logger.log({ description: 'Get template called.', func: 'get', obj: 'TemplatesAction' });
				return _____request.get(this.templatesEndpoint).then(function (response) {
					_____logger.log({ description: 'Templates loaded.', response: response, func: 'get', obj: 'TemplatesAction' });
					return response;
				})['catch'](function (errRes) {
					_____logger.error({ description: 'Error getting templates.', error: errRes, func: 'get', obj: 'TemplatesAction' });
					return Promise.reject(errRes);
				});
			}

			//Add an application
		}, {
			key: 'add',
			value: function add(appData) {
				_____logger.log({ description: 'Add template called.', func: 'add', obj: 'TemplatesAction' });
				return _____request.post(this.templatesEndpoint, appData).then(function (response) {
					_____logger.log({ description: 'Templates added successfully.', func: 'add', obj: 'TemplatesAction' });
					return response;
				})['catch'](function (errRes) {
					_____logger.error({ description: 'Error adding template.', error: errRes, func: 'add', obj: 'TemplatesAction' });
					return Promise.reject(errRes);
				});
			}

			//Search with partial of username
		}, {
			key: 'search',
			value: function search(query) {
				_____logger.log({ description: 'Search template called.', query: query, func: 'search', obj: 'TemplatesAction' });
				var searchEndpoint = this.templatesEndpoint + '/search/';
				if (query && _.isString(query)) {
					searchEndpoint += query;
				}
				_____logger.log({ description: 'Search endpoint created.', endpoint: searchEndpoint, func: 'search', obj: 'TemplatesAction' });
				return _____request.get(searchEndpoint).then(function (response) {
					_____logger.log({ description: 'Template(s) found successfully.', response: response, endpoint: searchEndpoint, func: 'search', obj: 'TemplatesAction' });
					return response;
				})['catch'](function (errRes) {
					_____logger.log({ description: 'Error searching for templates.', query: query, error: errRes, endpoint: searchEndpoint, func: 'search', obj: 'TemplatesAction' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'templatesEndpoint',
			get: function get() {
				var endpointArray = [matter.endpoint, 'templates'];
				//Check for app groups action
				if (_.has(this, 'app') && _.has(this.app, 'name')) {
					// endpointArray.splice(1, 0, 'apps', this.app.name);
					_____logger.log({ description: 'Templates action is not currently supported for a specific application.', func: 'accountsEndpoint', obj: 'AccountsAction' });
				}
				//Create string from endpointArray
				var endpointStr = endpointArray.join('/');
				_____logger.log({ description: 'Templates endpoint built.', endpoint: endpointStr, func: 'templatesEndpoint', obj: 'TemplatesAction' });
				return endpointStr;
			}
		}]);

		return TemplatesAction;
	})();

	var ____request = matter.utils.request;
	var ____logger = matter.utils.logger;

	//Actions for directories list

	var _DirectoriesAction = (function () {
		function _DirectoriesAction(actionData) {
			_classCallCheck(this, _DirectoriesAction);

			//Check to see if action is for a specific app
			if (actionData && _.isObject(actionData) && _.has(actionData, 'app')) {
				this.app = actionData.app;
				____logger.log({ description: 'Provided app data set to app parameter.', action: this, providedData: actionData, func: 'constructor', obj: 'DirectoriesAction' });
			} else if (actionData && _.isString(actionData)) {
				this.app = { name: actionData };
				____logger.log({ description: 'App name provided as string was set.', action: this, providedData: actionData, func: 'constructor', obj: 'DirectoriesAction' });
			}
			____logger.info({ description: 'New directories action.', action: this, providedData: actionData, func: 'constructor', obj: 'DirectoriesAction' });
		}

		_createClass(_DirectoriesAction, [{
			key: 'get',

			//Get users or single application
			value: function get() {
				____logger.debug({ description: 'Directories get called.', action: this, func: 'get', obj: 'DirectoriesAction' });
				return ____request.get(this.directoriesEndpoint).then(function (response) {
					____logger.info({ descrption: 'Directories loaded successfully.', response: response, func: 'get', obj: 'DirectoriesAction' });
					return response;
				})['catch'](function (errRes) {
					____logger.error({ descrption: 'error getting users', error: errRes, func: 'get', obj: 'DirectoriesAction' });
					return Promise.reject(errRes);
				});
			}

			//Add an application
		}, {
			key: 'add',
			value: function add(appData) {
				____logger.debug({ description: 'Add directory called.', action: this, appData: appData, func: 'get', obj: 'DirectoriesAction' });
				return ____request.post(this.directoriesEndpoint, appData).then(function (response) {
					____logger.log({ description: 'Application added successfully.', response: response, func: 'add', obj: 'DirectoriesAction' });
					//TODO: Return list of group objects
					return response;
				})['catch'](function (errRes) {
					____logger.error({ description: 'Error adding group.', error: errRes, func: 'add', obj: 'DirectoriesAction' });
					return Promise.reject(errRes);
				});
			}

			//Search with partial of directory name
		}, {
			key: 'search',
			value: function search(query) {
				var searchEndpoint = this.directoriesEndpoint + '/search/';
				if (query && _.isString(query)) {
					searchEndpoint += query;
				}
				if (!query || query == '') {
					____logger.debug({ description: 'Null query, returning empty array.', func: 'search', obj: 'DirectoriesAction' });
					return Promise.resolve([]);
				}
				return ____request.get(searchEndpoint).then(function (response) {
					____logger.log({ description: 'Found directories based on search.', response: response, func: 'search', obj: 'DirectoriesAction' });
					return response;
				})['catch'](function (errRes) {
					____logger.error({ description: 'Error searching directories.', error: errRes, func: 'search', obj: 'DirectoriesAction' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'directoriesEndpoint',
			get: function get() {
				var endpointArray = [matter.endpoint, 'directories'];
				//Check for app groups action
				if (_.has(this, 'app') && _.has(this.app, 'name')) {
					endpointArray = endpointArray.splice(1, 0, 'apps', this.app.name);
				}
				//Create string from endpointArray
				var endpointStr = endpointArray.join('/');
				____logger.log({ description: 'Directories endpoint built.', endpoint: endpointStr, func: 'directoriesEndpoint', obj: 'DirectoriesAction' });
				return endpointStr;
			}
		}]);

		return _DirectoriesAction;
	})();

	var ___logger = matter.utils.logger;

	var File = (function () {
		function File(fileData) {
			_classCallCheck(this, File);

			if (fileData && _.isObject(fileData) && _.has(fileData, ['path', 'app'])) {
				this.path = fileData.path;
				this.app = fileData.app;
				this.pathArray = this.path.split('/');
				//Get name from data or from pathArray
				this.name = _.has(fileData, 'name') ? fileData.name : this.pathArray[this.pathArray.length - 1];
			} else if (fileData && !_.isObject(fileData)) {
				___logger.error({ description: 'File data is not an object. File data must be an object that includes path and appName.', func: 'constructor', obj: 'File' });
				//TODO: Get appName from path data?
				throw new Error('File data must be an object that includes path and appName.');
			} else {
				___logger.error({ description: 'File data include path and app is needed to create a File action.', func: 'constructor', obj: 'File' });
				throw new Error('File data with path and app is needed to create file action.');
			}
			this.type = 'file';
			___logger.debug({ description: 'File object constructed.', file: this, func: 'constructor', obj: 'File' });
		}

		//------------------ Utility Functions ------------------//

		// AWS Config

		_createClass(File, [{
			key: 'get',
			value: function get() {
				if (!this.app || !this.app.frontend) {
					___logger.error({ description: 'Application Frontend data not available. Make sure to call .get().', func: 'get', obj: 'File' });
					return Promise.reject({ message: 'Front end data is required to get file.' });
				} else {
					var saveParams = {
						Bucket: this.app.frontend.bucketName,
						Key: this.path
					};
					//Set contentType from fileData to ContentType parameter of new object
					if (fileData.contentType) {
						saveParams.ContentType = fileData.contentType;
					}
					___logger.debug({ description: 'File get params built.', saveParams: saveParams, fileData: fileData, func: 'get', obj: 'File' });
					return s3.getObject(saveParams, function (err, data) {
						//[TODO] Add putting object ACL (make public)
						if (!err) {
							___logger.error({ description: 'File loaded successfully.', fileData: data, func: 'get', obj: 'File' });
							return data;
						} else {
							___logger.error({ description: 'Error loading file from S3.', error: err, func: 'get', obj: 'File' });
							return Promise.reject(err);
						}
					});
				}
			}

			//Alias for get
		}, {
			key: 'open',
			value: function open() {
				return this.get;
			}
		}, {
			key: 'publish',
			value: function publish(fileData) {
				//TODO: Publish file to application
				___logger.debug({ description: 'File publish called.', file: this, fileData: fileData, func: 'publish', obj: 'File' });
				if (!this.app.frontend) {
					___logger.error({ description: 'Application Frontend data not available. Make sure to call .get().', func: 'publish', obj: 'File' });
					return Promise.reject({ message: 'Front end data is required to publish file.' });
				} else {
					if (!_.has(fileData, ['content', 'path'])) {
						___logger.error({ description: 'File data including path and content required to publish.', func: 'publish', obj: 'File' });
						return Promise.reject({ message: 'File data including path and content required to publish.' });
					}
					var saveParams = {
						Bucket: this.app.frontend.bucketName,
						Key: fileData.path,
						Body: fileData.content,
						ACL: 'public-read'
					};
					//Set contentType from fileData to ContentType parameter of new object
					if (fileData.contentType) {
						saveParams.ContentType = fileData.contentType;
					}
					//If AWS Credential do not exist, set them
					if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
						___logger.debug({ description: 'AWS creds do not exist, so they are being set.', func: 'publish', obj: 'File' });
						_setAWSConfig();
					}
					___logger.debug({ description: 'File publish params built.', saveParams: saveParams, fileData: fileData, func: 'publish', obj: 'File' });
					return s3.putObject(saveParams, function (err, data) {
						//[TODO] Add putting object ACL (make public)
						if (!err) {
							___logger.error({ description: 'File saved successfully.', fileData: data, func: 'publish', obj: 'File' });
							return data;
						} else {
							___logger.error({ description: 'Error saving file to S3.', error: err, func: 'publish', obj: 'File' });
							return Promise.reject(err);
						}
					});
				}
			}
		}, {
			key: 'getTypes',
			value: function getTypes() {
				//Get content type and file type from extension
			}
		}, {
			key: 'openWithFirepad',
			value: function openWithFirepad(divId) {
				//TODO:Create new Firepad instance within div
			}
		}, {
			key: 'getDefaultContent',
			value: function getDefaultContent() {}
		}, {
			key: 'ext',
			get: function get() {
				var re = /(?:\.([^.]+))?$/;
				this.ext = re.exec(this.name)[1];
			}
		}]);

		return File;
	})();

	function _setAWSConfig() {
		AWS.config.update({
			credentials: new AWS.CognitoIdentityCredentials({
				IdentityPoolId: config.aws.cognito.poolId
			}),
			region: config.aws.region
		});
	}

	var __logger = matter.utils.logger;

	var Files = (function () {
		function Files(filesData) {
			_classCallCheck(this, Files);

			if (filesData && _.isObject(filesData) && (_.has(filesData, 'appName') || _.has(filesData, 'name'))) {
				//Data is object containing directory data
				this.app = filesData.filesData;
			} else if (filesData && _.isString(filesData)) {
				//Data is string name
				this.app = { name: filesData };
			} else if (filesData && _.isArray(filesData)) {
				//TODO: Handle an array of files being passed as data
				__logger.error({ description: 'Action data object with name is required to start a Files Action.', func: 'constructor', obj: 'Files' });
				throw new Error('Files Data object with name is required to start a Files action.');
			} else {
				__logger.error({ description: 'Action data object with name is required to start a Files Action.', func: 'constructor', obj: 'Files' });
				throw new Error('Files Data object with name is required to start a Files action.');
			}
			__logger.debug({ description: 'Files object constructed.', func: 'constructor', obj: 'Files' });
		}

		//------------------ Utility Functions ------------------//

		// AWS Config

		_createClass(Files, [{
			key: 'publish',
			value: function publish() {
				//TODO: Publish all files
			}
		}, {
			key: 'get',
			value: function get() {
				var _this7 = this;

				if (!this.app || !this.app.frontend || !this.app.frontend.bucketName) {
					__logger.error({ description: 'Application Frontend data not available. Make sure to call .get().', func: 'get', obj: 'Files' });
					return Promise.reject({ message: 'Bucket name required to get objects' });
				} else {
					var _ret2 = (function () {
						//If AWS Credential do not exist, set them
						if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
							// logger.info('AWS creds are being updated to make request');
							setAWSConfig();
						}
						var s3 = new AWS.S3();
						var listParams = { Bucket: _this7.app.frontend.bucketName };
						return {
							v: new Promise(function (resolve, reject) {
								s3.listObjects(listParams, function (err, data) {
									if (!err) {
										__logger.info({ description: 'Files list loaded.', filesData: data, func: 'get', obj: 'Files' });
										return resolve(data.Contents);
									} else {
										__logger.error({ description: 'Error getting files from S3.', error: err, func: 'get', obj: 'Files' });
										return reject(err);
									}
								});
							})
						};
					})();

					if (typeof _ret2 === 'object') return _ret2.v;
				}
			}
		}, {
			key: 'add',
			value: function add() {
				//TODO: Add a file to files list
			}
		}, {
			key: 'del',
			value: function del() {
				//TODO: Delete a file from files list
			}
		}, {
			key: 'structure',
			get: function get() {
				__logger.debug({ description: 'Structure called.', func: 'getStructure', obj: 'Application' });
				return this.get().then(function (filesArray) {
					var childStruct = childrenStructureFromArray(filesArray);
					__logger.log({ description: 'Child struct from array.', childStructure: childStruct, func: 'getStructure', obj: 'Application' });
					return childStruct;
				}, function (err) {
					__logger.error({ description: 'Error getting application files.', error: err, func: 'getStructure', obj: 'Application' });
					return Promise.reject({ message: 'Error getting files.', error: err });
				});
			}
		}]);

		return Files;
	})();

	function setAWSConfig() {
		AWS.config.update({
			credentials: new AWS.CognitoIdentityCredentials({
				IdentityPoolId: config.aws.cognito.poolId
			}),
			region: config.aws.region
		});
	}
	//Convert from array file structure (from S3) to 'children' structure used in Editor GUI (angular-tree-control)
	//Examples for two files (index.html and /testFolder/file.js):
	//Array structure: [{path:'index.html'}, {path:'testFolder/file.js'}]
	//Children Structure [{type:'folder', name:'testfolder', children:[{path:'testFolder/file.js', name:'file.js', filetype:'javascript', contentType:'application/javascript'}]}]
	function childrenStructureFromArray(fileArray) {
		// logger.log('childStructureFromArray called:', fileArray);
		//Create a object for each file that stores the file in the correct 'children' level
		var mappedStructure = fileArray.map(function (file) {
			return buildStructureObject(file);
		});
		return combineLikeObjs(mappedStructure);
	}
	//Convert file with key into a folder/file children object
	function buildStructureObject(file) {
		var pathArray;
		// console.log('buildStructureObject with:', file);
		if (_.has(file, 'path')) {
			//Coming from files already having path (structure)
			pathArray = file.path.split('/');
		} else {
			//Coming from aws
			pathArray = file.Key.split('/');
			// console.log('file before pick:', file);
			file = _.pick(file, 'Key');
			file.path = file.Key;
			file.name = file.Key;
		}
		var currentObj = file;
		if (pathArray.length == 1) {
			currentObj.name = pathArray[0];
			if (!_.has(currentObj, 'type')) {
				currentObj.type = 'file';
			}
			currentObj.path = pathArray[0];
			return currentObj;
		} else {
			var finalObj = {};
			_.each(pathArray, function (loc, ind, list) {
				if (ind != list.length - 1) {
					//Not the last loc
					currentObj.name = loc;
					currentObj.path = _.first(list, ind + 1).join('/');
					currentObj.type = 'folder';
					currentObj.children = [{}];
					//TODO: Find out why this works
					if (ind == 0) {
						finalObj = currentObj;
					}
					currentObj = currentObj.children[0];
				} else {
					currentObj.type = 'file';
					currentObj.name = loc;
					currentObj.path = pathArray.join('/');
					if (file.$id) {
						currentObj.$id = file.$id;
					}
				}
			});
			return finalObj;
		}
	}
	//Recursivley combine children of object's that have the same names
	function combineLikeObjs(mappedArray) {
		var takenNames = [];
		var finishedArray = [];
		_.each(mappedArray, function (obj, ind, list) {
			if (takenNames.indexOf(obj.name) == -1) {
				takenNames.push(obj.name);
				finishedArray.push(obj);
			} else {
				var likeObj = _.findWhere(mappedArray, { name: obj.name });
				//Combine children of like objects
				likeObj.children = _.union(obj.children, likeObj.children);
				likeObj.children = combineLikeObjs(likeObj.children);
				// logger.log('extended obj:',likeObj);
			}
		});
		return finishedArray;
	}

	//Convenience vars
	var _request = matter.utils.request;
	var _logger = matter.utils.logger;

	/**
  * Application class.
  *
  */

	var _Application = (function () {
		function _Application(appData) {
			_classCallCheck(this, _Application);

			//Setup application data based on input
			if (appData && _.isObject(appData)) {
				this.name = appData.name;
				this.owner = appData.owner || null;
				this.collaborators = appData.collaborators || [];
				this.createdAt = appData.createdAt;
				this.updatedAt = appData.updatedAt;
				this.frontend = appData.frontend || {};
				this.backend = appData.backend || {};
				this.groups = appData.groups || null;
				this.directories = appData.directories || null;
			} else if (appData && _.isString(appData)) {
				this.name = appData;
			}
			if (Firebase) {
				this.fbRef = new Firebase(config.fbUrl + appData.name);
			}
			// logger.debug({description: 'Application object created.', application: this, func: 'constructor', obj: 'Application'});
		}

		_createClass(_Application, [{
			key: 'get',

			//Get applications or single application
			value: function get() {
				_logger.debug({ description: 'Application get called.', func: 'get', obj: 'Application' });
				return _request.get(this.appEndpoint).then(function (response) {
					_logger.info({ description: 'Application loaded successfully.', response: response, application: new _Application(response), func: 'get', obj: 'Application' });
					return new _Application(response);
				})['catch'](function (errRes) {
					_logger.error({ description: 'Error getting Application.', error: errRes, func: 'get', obj: 'Application' });
					return Promise.reject(errRes);
				});
			}

			//Update an application
		}, {
			key: 'update',
			value: function update(appData) {
				_logger.debug({ description: 'Application update called.', func: 'update', obj: 'Application' });
				return _request.put(this.appEndpoint, appData).then(function (response) {
					_logger.info({ description: 'Application updated successfully.', response: response, func: 'update', obj: 'Application' });
					return new _Application(response);
				})['catch'](function (errRes) {
					_logger.error({ description: 'Error updating application.', error: errRes, func: 'update', obj: 'Application' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'addStorage',
			value: function addStorage() {
				_logger.debug({ description: 'Application add storage called.', application: this, func: 'addStorage', obj: 'Application' });
				return _request.post(this.appEndpoint + '/storage', appData).then(function (response) {
					_logger.info({ description: 'Storage successfully added to application.', response: response, application: new _Application(response), func: 'addStorage', obj: 'Application' });
					return new _Application(response);
				})['catch'](function (errRes) {
					_logger.error({ description: 'Error adding storage to application.', error: errRes, func: 'addStorage', obj: 'Application' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'applyTemplate',
			value: function applyTemplate() {
				var _this8 = this;

				_logger.error({ description: 'Applying templates to existing applications is not currently supported.', func: 'applyTemplate', obj: 'Application' });
				return _request.post(endpoint, appData).then(function (response) {
					_logger.info({ description: 'Template successfully applied to application.', response: response, application: _this8, func: 'applyTemplate', obj: 'Application' });
					return new _Application(response);
				})['catch'](function (errRes) {
					_logger.error({ description: 'Error applying template to application.', error: errRes, application: _this8, func: 'applyTemplate', obj: 'Application' });
					return Promise.reject(errRes);
				});
			}

			//Files object that contains files methods
		}, {
			key: 'file',
			value: function file(fileData) {
				_logger.debug({ description: 'Applications file action called.', fileData: fileData, application: this, func: 'file', obj: 'Application' });
				return new File({ app: this, fileData: fileData });
			}
		}, {
			key: 'user',
			value: function user(userData) {
				_logger.debug({ description: 'Applications user action called.', userData: userData, application: this, func: 'user', obj: 'Application' });
				return new Account({ app: this, userData: userData });
			}
		}, {
			key: 'group',
			value: function group(groupData) {
				_logger.debug({ description: 'Applications group action called.', groupData: groupData, application: this, func: 'group', obj: 'Application' });
				return new Group({ app: this, groupData: groupData });
			}
		}, {
			key: 'directory',
			value: function directory(directoryData) {
				_logger.debug({ description: 'Applications directory action called.', directoryData: directoryData, application: this, func: 'directory', obj: 'Application' });
				return new Directory({ app: this, directoryData: directoryData });
			}
		}, {
			key: 'appEndpoint',
			get: function get() {
				return matter.endpoint + '/apps/' + this.name;
			}
		}, {
			key: 'files',
			get: function get() {
				_logger.debug({ description: 'Applications files action called.', application: this, func: 'files', obj: 'Application' });
				return new Files({ app: this });
			}
		}, {
			key: 'users',
			get: function get() {
				_logger.debug({ description: 'Applications users action called.', application: this, func: 'user', obj: 'Application' });
				return new AccountsAction({ app: this });
			}
		}, {
			key: 'groups',
			get: function get() {
				_logger.debug({ description: 'Applications groups action called.', application: this, func: 'groups', obj: 'Application' });
				return new GroupsAction({ app: this });
			}
		}, {
			key: 'directories',
			get: function get() {
				_logger.debug({ description: 'Applications directories action called.', application: this, func: 'directories', obj: 'Application' });
				return new _DirectoriesAction({ app: this });
			}
		}]);

		return _Application;
	})();

	var request = matter.utils.request;
	var logger = matter.utils.logger;

	//Actions for applications list

	var AppsAction = (function () {
		function AppsAction() {
			_classCallCheck(this, AppsAction);
		}

		/**Grout Client Class
   * @ description Extending matter provides token storage and login/logout/signup capabilities
   */

		_createClass(AppsAction, [{
			key: 'get',

			//Get applications or single application
			value: function get() {
				logger.debug({ description: 'Apps get called.', action: this, func: 'get', obj: 'AppsAction' });
				return request.get(this.appsEndpoint).then(function (response) {
					logger.info({ description: 'Apps data loaded successfully.', response: response, func: 'get', obj: 'AppsAction' });
					return response;
				})['catch'](function (errRes) {
					logger.error({ description: 'Error getting apps data.', error: errRes, func: 'get', obj: 'AppsAction' });
					return Promise.reject(errRes);
				});
			}

			//Add an application
		}, {
			key: 'add',
			value: function add(appData) {
				logger.debug({ description: 'Application add called.', appData: appData, func: 'add', obj: 'AppsAction' });
				return matter.utils.request.post(this.appsEndpoint, appData).then(function (response) {
					logger.info({ description: 'Application added successfully.', response: response, func: 'add', obj: 'AppsAction' });
					return new Application(response);
				})['catch'](function (errRes) {
					logger.error({ description: 'Error adding app.', error: errRes, func: 'add', obj: 'AppsAction' });
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'appsEndpoint',

			//Call matter with name and settings
			get: function get() {
				return matter.endpoint + '/apps';
			}
		}]);

		return AppsAction;
	})();

	var Grout = (function (_Matter) {
		_inherits(Grout, _Matter);

		//TODO: Use getter/setter to make this not a function

		function Grout() {
			_classCallCheck(this, Grout);

			//Call matter with tessellate
			_get(Object.getPrototypeOf(Grout.prototype), 'constructor', this).call(this, config.appName, config.matterOptions);
		}

		//Start a new Apps Action

		_createClass(Grout, [{
			key: 'app',

			//Start a new App action
			value: function app(appName) {
				this.utils.logger.debug({ description: 'Templates Action called.', appName: appName, template: new _Application(appName), func: 'app', obj: 'Grout' });
				return new _Application(appName);
			}

			//Start a new Apps Action
		}, {
			key: 'template',

			//Start a new App action
			value: function template(templateData) {
				this.utils.logger.debug({ description: 'Template Action called.', templateData: templateData, template: new Template(templateData), func: 'template', obj: 'Grout' });
				return new Template(templateData);
			}

			//Start a new Accounts action
		}, {
			key: 'account',

			//Start a new Account action
			value: function account(userData) {
				this.utils.logger.debug({ description: 'Account Action called.', userData: userData, user: new Account(userData), func: 'user', obj: 'Grout' });
				return new Account(userData);
			}

			//Start a new Accounts action
		}, {
			key: 'user',

			//Start a new Account action
			value: function user(userData) {
				this.utils.logger.debug({ description: 'Account Action called.', userData: userData, user: new Account(userData), func: 'user', obj: 'Grout' });
				return new Account(userData);
			}

			//Start a new Groups action
		}, {
			key: 'group',

			//Start a new Group action
			value: function group(groupData) {
				this.utils.logger.debug({ description: 'Group Action called.', groupData: groupData, action: new Group({ app: this, groupData: groupData }), func: 'group', obj: 'Grout' });
				return new Group(groupData);
			}

			//Start a new Directories action
		}, {
			key: 'directory',

			//Start a new Group action
			value: function directory(directoryData) {
				this.utils.logger.debug({ description: 'Directory Action called.', directoryData: directoryData, action: new Directory(directoryData), func: 'directory', obj: 'Grout' });
				return new Directory(directoryData);
			}
		}, {
			key: 'apps',
			get: function get() {
				this.utils.logger.debug({ description: 'Apps Action called.', action: new AppsAction(), func: 'apps', obj: 'Grout' });
				return new AppsAction();
			}
		}, {
			key: 'templates',
			get: function get() {
				this.utils.logger.debug({ description: 'Templates Action called.', action: new TemplatesAction(), func: 'templates', obj: 'Grout' });
				return new TemplatesAction();
			}
		}, {
			key: 'accounts',
			get: function get() {
				this.utils.logger.debug({ description: 'Account Action called.', action: new AccountsAction(), func: 'users', obj: 'Grout' });
				return new AccountsAction();
			}
		}, {
			key: 'users',
			get: function get() {
				this.utils.logger.debug({ description: 'Accounts Action called.', action: new AccountsAction(), func: 'users', obj: 'Grout' });
				return new AccountsAction();
			}
		}, {
			key: 'groups',
			get: function get() {
				this.utils.logger.debug({ description: 'Groups Action called.', action: new GroupsAction(), func: 'groups', obj: 'Grout' });
				return new GroupsAction();
			}
		}, {
			key: 'directories',
			get: function get() {
				this.utils.logger.debug({ description: 'Directories Action called.', action: new DirectoriesAction(), func: 'directories', obj: 'Grout' });
				return new DirectoriesAction();
			}
		}]);

		return Grout;
	})(Matter);

	;

	return Grout;
});
//# sourceMappingURL=grout.js.map