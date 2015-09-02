var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('jwt-decode'), require('superagent')) : typeof define === 'function' && define.amd ? define(['lodash', 'jwt-decode', 'superagent'], factory) : global.Matter = factory(global._, global.jwtDecode, global.superagent);
})(this, function (_, jwtDecode, superagent) {
	'use strict';

	_ = 'default' in _ ? _['default'] : _;
	jwtDecode = 'default' in jwtDecode ? jwtDecode['default'] : jwtDecode;
	superagent = 'default' in superagent ? superagent['default'] : superagent;

	var config = {
		serverUrl: 'http://tessellate.elasticbeanstalk.com',
		tokenName: 'tessellate',
		tokenDataName: 'tessellate-tokenData'
	};

	var logger = {
		log: function log(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'local') {
				console.log(logData);
			} else {
				console.log.apply(console, msgArgs);
			}
		},
		info: function info(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'local') {
				console.info(logData);
			} else {
				console.info.apply(console, msgArgs);
			}
		},
		warn: function warn(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'local') {
				console.warn(logData);
			} else {
				console.warn.apply(console, msgArgs);
			}
		},
		debug: function debug(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'local') {
				console.log(logData);
			} else {
				console.log.apply(console, msgArgs);
			}
		},
		error: function error(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'local') {
				console.error(logData);
			} else {
				console.error.apply(console, msgArgs);
				//TODO: Log to external logger
			}
		}
	};

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
	// TODO: Store objects within local storage.
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
			//TODO: Handle itemValue being an object instead of a string
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
			//TODO: Handle itemValue being an object instead of a string
			// this.item(itemName) = itemValue;
			data[itemName] = itemValue;
			if (this.localExists) {
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
				return window.sessionStorage.getItem(itemName);
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
					logger.error({ description: 'Error removing item from session storage', error: err, obj: 'storage', func: 'removeItem' });
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
					logger.warn('Session storage could not be cleared.', err);
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
						logger.error({ description: 'Error saving to session storage', error: err, obj: 'storage', func: 'localExists' });
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
				logger.error({ description: 'Error decoding token.', data: tokenData, error: err, func: 'decodeToken', file: 'token' });
				throw new Error('Error decoding token.');
			}
		}
		return tokenData;
	}
	var token = Object.defineProperties({
		save: function save(tokenStr) {
			this.string = tokenStr;
		},
		'delete': function _delete() {
			storage.removeItem(config.tokenName);
			logger.log({ description: 'Token was removed.', func: 'delete', obj: 'token' });
		}
	}, {
		string: {
			get: function get() {
				return storage.getItem(config.tokenName);
			},
			set: function set(tokenStr) {
				logger.log({ description: 'Token was set.', token: tokenStr, func: 'string', obj: 'token' });
				this.data = jwtDecode(tokenStr);
				storage.setItem(config.tokenName, tokenStr);
			},
			configurable: true,
			enumerable: true
		},
		data: {
			get: function get() {
				if (storage.getItem(config.tokenDataName)) {
					return storage.getItem(config.tokenDataName);
				} else {
					return decodeToken(this.string);
				}
			},
			set: function set(tokenData) {
				if (_.isString(tokenData)) {
					var tokenStr = tokenData;
					tokenData = decodeToken(tokenStr);
					logger.info({ description: 'Token data was set as string. Decoding token.', token: tokenStr, tokenData: tokenData, func: 'data', obj: 'token' });
				} else {
					logger.log({ description: 'Token data was set.', data: tokenData, func: 'data', obj: 'token' });
					storage.setItem(config.tokenDataName, tokenData);
				}
			},
			configurable: true,
			enumerable: true
		}
	});

	var request = {
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
						logger.warn('Unauthorized. You must be signed into make this request.');
					}
					return reject(err);
				}
			});
		});
	}
	function addAuthHeader(req) {
		if (token.string) {
			req = req.set('Authorization', 'Bearer ' + token.string);
			logger.info({ message: 'Set auth header', func: 'addAuthHeader', file: 'request' });
		}
		return req;
	}

	var user = undefined;
	var endpoints = undefined;

	var Matter = (function () {
		/* Constructor
   * @param {string} appName Name of application
   */

		function Matter(appName, opts) {
			_classCallCheck(this, Matter);

			if (!appName) {
				logger.error({ description: 'Application name requires to use Matter.', func: 'constructor', obj: 'Matter' });
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
				return request.post(this.endpoint + '/signup', signupData).then(function (response) {
					logger.log({ description: 'Account request successful.', signupData: signupData, response: response, func: 'signup', obj: 'Matter' });
					if (_.has(response, 'account')) {
						return response.account;
					} else {
						logger.warn({ description: 'Account was not contained in signup response.', signupData: signupData, response: response, func: 'signup', obj: 'Matter' });
						return response;
					}
				})['catch'](function (errRes) {
					logger.error({ description: 'Error requesting signup.', signupData: signupData, error: errRes, func: 'signup', obj: 'Matter' });
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
					logger.error({ description: 'Username/Email and Password are required to login', func: 'login', obj: 'Matter' });
					return Promise.reject({ message: 'Username/Email and Password are required to login' });
				}
				return request.put(this.endpoint + '/login', loginData).then(function (response) {
					if (_.has(response, 'data') && _.has(response.data, 'status') && response.data.status == 409) {
						logger.warn({ description: 'Account not found.', response: response, func: 'login', obj: 'Matter' });
						return Promise.reject(response.data);
					} else {
						logger.log({ description: 'Successful login.', response: response, func: 'login', obj: 'Matter' });
						if (_.has(response, 'token')) {
							_this.token.string = response.token;
						}
						if (_.has(response, 'account')) {
							_this.storage.setItem('currentUser');
						}
						return response.account;
					}
				})['catch'](function (errRes) {
					logger.error({ description: 'Error requesting login.', error: errRes, status: errRes.status, func: 'login', obj: 'Matter' });
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

				return request.put(this.endpoint + '/logout').then(function (response) {
					logger.log({ description: 'Logout successful.', response: response, func: 'logout', obj: 'Matter' });
					_this2.storage.removeItem('currentUser');
					_this2.token['delete']();
					return response;
				})['catch'](function (errRes) {
					logger.error({ description: 'Error requesting log out: ', error: errRes, func: 'logout', obj: 'Matter' });
					_this2.storage.removeItem('currentUser');
					_this2.token['delete']();
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'endpoint',
			get: function get() {
				var serverUrl = config.serverUrl;
				if (_.has(this, 'options') && this.options.localServer) {
					serverUrl = 'http://localhost:4000';
					logger.info({ description: 'LocalServer option was set to true. Now server url is local server.', url: serverUrl, func: 'endpoint', obj: 'Matter' });
				}
				if (this.name == 'tessellate') {
					//Remove url if host is server
					if (window && _.has(window, 'location') && window.location.host == serverUrl) {
						serverUrl = '';
						logger.info({ description: 'Host is Server, serverUrl simplified!', url: serverUrl, func: 'endpoint', obj: 'Matter' });
					}
				} else {
					serverUrl = config.serverUrl + '/apps/' + this.name;
					logger.info({ description: 'Server url set.', url: serverUrl, func: 'endpoint', obj: 'Matter' });
				}
				return serverUrl;
			}
		}, {
			key: 'currentUser',
			get: function get() {
				var _this3 = this;

				if (this.storage.item('currentUser')) {
					//TODO: Check to see if this comes back as a string
					return Promise.resove(this.storage.item('currentUser'));
				} else {
					return request.get(this.endpoint + '/user').then(function (response) {
						//TODO: Save user information locally
						logger.log({ description: 'Current User Request responded.', responseData: response.data, func: 'currentUser', obj: 'Matter' });
						_this3.currentUser = response.data;
						return response.data;
					})['catch'](function (errRes) {
						logger.error({ description: 'Error requesting current user.', error: errRes, func: 'currentUser', obj: 'Matter' });
						return Promise.reject(errRes);
					});
				}
			}
		}, {
			key: 'storage',
			get: function get() {
				return storage;
			}
		}, {
			key: 'token',
			get: function get() {
				return token;
			}
		}, {
			key: 'isLoggedIn',
			get: function get() {
				return this.token.string ? true : false;
			}
		}]);

		return Matter;
	})();

	;

	return Matter;
});
//# sourceMappingURL=matter.js.map