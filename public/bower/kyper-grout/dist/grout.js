var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('jwt-decode'), require('superagent'), require('firebase')) : typeof define === 'function' && define.amd ? define(['lodash', 'jwt-decode', 'superagent', 'firebase'], factory) : global.Grout = factory(global._, global.jwtDecode, global.superagent, global.Firebase);
})(this, function (_, jwtDecode, superagent, Firebase) {
	'use strict';

	_ = 'default' in _ ? _['default'] : _;
	jwtDecode = 'default' in jwtDecode ? jwtDecode['default'] : jwtDecode;
	superagent = 'default' in superagent ? superagent['default'] : superagent;
	Firebase = 'default' in Firebase ? Firebase['default'] : Firebase;

	var _config = {
		serverUrl: 'http://tessellate.elasticbeanstalk.com',
		tokenName: 'tessellate',
		tokenDataName: 'tessellate-tokenData'
	};

	var logger = {
		log: function log(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'local') {
				console.log(logData);
			} else {
				console.log.apply(console, msgArgs);
			}
		},
		info: function info(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'local') {
				console.info(logData);
			} else {
				console.info.apply(console, msgArgs);
			}
		},
		warn: function warn(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'local') {
				console.warn(logData);
			} else {
				console.warn.apply(console, msgArgs);
			}
		},
		debug: function debug(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'local') {
				console.log(logData);
			} else {
				console.log.apply(console, msgArgs);
			}
		},
		error: function error(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (_config.envName == 'local') {
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
	var _storage = Object.defineProperties({
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
			_storage.removeItem(_config.tokenName);
			logger.log({ description: 'Token was removed.', func: 'delete', obj: 'token' });
		}
	}, {
		string: {
			get: function get() {
				return _storage.getItem(_config.tokenName);
			},
			set: function set(tokenStr) {
				logger.log({ description: 'Token was set.', token: tokenStr, func: 'string', obj: 'token' });
				this.data = jwtDecode(tokenStr);
				_storage.setItem(_config.tokenName, tokenStr);
			},
			configurable: true,
			enumerable: true
		},
		data: {
			get: function get() {
				if (_storage.getItem(_config.tokenDataName)) {
					return _storage.getItem(_config.tokenDataName);
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
					_storage.setItem(_config.tokenDataName, tokenData);
				}
			},
			configurable: true,
			enumerable: true
		}
	});

	var _request = {
		get: function get(endpoint, queryData) {
			var req = superagent.get(endpoint);
			if (queryData) {
				req.query(queryData);
			}
			req = _addAuthHeader(req);
			return _handleResponse(req);
		},
		post: function post(endpoint, data) {
			var req = superagent.post(endpoint).send(data);
			req = _addAuthHeader(req);
			return _handleResponse(req);
		},
		put: function put(endpoint, data) {
			var req = superagent.put(endpoint).send(data);
			req = _addAuthHeader(req);
			return _handleResponse(req);
		},
		del: function del(endpoint, data) {
			var req = superagent.put(endpoint).send(data);
			req = _addAuthHeader(req);
			return _handleResponse(req);
		}
	};

	function _handleResponse(req) {
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
	function _addAuthHeader(req) {
		if (token.string) {
			req = req.set('Authorization', 'Bearer ' + token.string);
			logger.info({ message: 'Set auth header', func: 'addAuthHeader', file: 'request' });
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
				return _request.post(this.endpoint + '/signup', signupData).then(function (response) {
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
				return _request.put(this.endpoint + '/login', loginData).then(function (response) {
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

				return _request.put(this.endpoint + '/logout').then(function (response) {
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
				var serverUrl = _config.serverUrl;
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
					serverUrl = _config.serverUrl + '/apps/' + this.name;
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
					return _request.get(this.endpoint + '/user').then(function (response) {
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
				return _storage;
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

	var config = {
		serverUrl: 'http://tessellate.elasticbeanstalk.com',
		tokenName: 'grout',
		fbUrl: 'https://pruvit.firebaseio.com/',
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

	var storage = new Matter('tesselate').storage;

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
					// console.log('Response:', res);
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
		if (storage.getItem(config.tokenName)) {
			req = req.set('Authorization', 'Bearer ' + storage.getItem(config.tokenName));
			console.log('Set auth header');
		}
		return req;
	}

	/**
  * Application class.
  *
  */

	var _Application = (function () {
		function _Application(appData) {
			_classCallCheck(this, _Application);

			this.name = appData.name;
			this.owner = appData.owner || null;
			this.collaborators = appData.collaborators || [];
			this.createdAt = appData.createdAt;
			this.updatedAt = appData.updatedAt;
			this.frontend = appData.frontend || {};
			this.backend = appData.backend || {};
			if (Firebase) {
				this.fbRef = new Firebase(config.fbUrl + appData.name);
			}
		}

		//------------------ Utility Functions ------------------//

		// AWS Config

		//Get files list and convert to structure

		_createClass(_Application, [{
			key: 'getStructure',
			value: function getStructure() {
				return this.getFiles().then(function (filesArray) {
					var childStruct = childrenStructureFromArray(filesArray);
					console.log('Child struct from array:', childStruct);
					return childStruct;
				}, function (err) {
					console.error('[Application.getStructure] Error getting files: ', err);
					return Promise.reject({ message: 'Error getting files.', error: err });
				});
			}

			//Get files list from S3
		}, {
			key: 'getFiles',
			value: function getFiles() {
				if (!this.frontend || !this.frontend.bucketName) {
					console.error('[Applicaiton.getFiles] Attempting to get objects for bucket without name.');
					return Promise.reject({ message: 'Bucket name required to get objects' });
				} else {
					//If AWS Credential do not exist, set them
					if (typeof AWS.config.credentials == 'undefined' || !AWS.config.credentials) {
						// console.info('AWS creds are being updated to make request');
						setAWSConfig();
					}
					var s3 = new AWS.S3();
					var listParams = { Bucket: this.frontend.bucketName };
					return new Promise(function (resolve, reject) {
						s3.listObjects(listParams, function (err, data) {
							if (!err) {
								console.log('[Application.getObjects()] listObjects returned:', data);
								return resolve(data.Contents);
							} else {
								console.error('[Application.getObjects()] Error listing objects:', err);
								return reject(err);
							}
						});
					});
				}
			}
		}, {
			key: 'publishFile',
			value: function publishFile(fileData) {
				if (!this.frontend) {
					console.error('Frontend data not available. Make sure to call .get().');
					return Promise.reject({ message: 'Front end data is required to publish file.' });
				}
				var saveParams = { Bucket: this.frontent.bucketName, Key: fileData.key, Body: fileData.content, ACL: 'public-read' };
				//Set contentType from fileData to ContentType parameter of new object
				if (fileData.contentType) {
					saveParams.ContentType = fileData.contentType;
				}
				// console.log('[$aws.$saveFiles] saveParams:', saveParams);
				return s3.putObject(saveParams, function (err, data) {
					//[TODO] Add putting object ACL (make public)
					if (!err) {
						console.log('[Application.publishFile()] file saved successfully. Returning:', data);
						return data;
					} else {
						console.error('[Application.publishFile()] Error saving file:', err);
						return Promise.reject(err);
					}
				});
			}
		}, {
			key: 'addStorage',
			value: function addStorage() {
				//TODO:Add storage bucket
				var endpoint = config.serverUrl + '/apps/' + this.name + '/storage';
				return request.post(endpoint, appData).then(function (response) {
					console.log('[Application.addStorage()] Apps:', response);
					return new _Application(response);
				})['catch'](function (errRes) {
					console.error('[Application.addStorage()] Error getting apps list: ', errRes);
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'applyTemplate',
			value: function applyTemplate() {
				var endpoint = config.serverUrl + '/apps/' + this.name + '/template';
				console.log('Applying templates to existing');
				// return request.post(endpoint, appData).then(function(response) {
				// 	console.log('[Application.addStorage()] Apps:', response);
				// 	if (!apps.isList) {
				// 		return new Application(response);
				// 	}
				// 	return response;
				// })['catch'](function(errRes) {
				// 	console.error('[Application.addStorage()] Error getting apps list: ', errRes);
				// 	return Promise.reject(errRes);
				// });
			}
		}]);

		return _Application;
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
		// console.log('childStructureFromArray called:', fileArray);
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
				// console.log('extended obj:',likeObj);
			}
		});
		return finishedArray;
	}

	//Actions for specific application

	var AppAction = (function () {
		function AppAction(appName) {
			_classCallCheck(this, AppAction);

			if (appName) {
				this.name = appName;
				this.endpoint = config.serverUrl + '/apps/' + this.name;
			} else {
				console.error('Application name is required to start an AppAction');
				throw new Error('Application name is required to start an AppAction');
			}
		}

		//Actions for applications list

		//Get applications or single application

		_createClass(AppAction, [{
			key: 'get',
			value: function get() {
				return request.get(this.endpoint).then(function (response) {
					console.log('[MatterClient.app().get()] App(s) data loaded:', response);
					return new _Application(response);
				})['catch'](function (errRes) {
					console.error('[MatterClient.app().get()] Error getting apps list: ', errRes);
					return Promise.reject(errRes);
				});
			}

			//Update an application
		}, {
			key: 'update',
			value: function update(appData) {
				return request.put(this.endpoint, appData).then(function (response) {
					console.log('[MatterClient.apps().update()] App:', response);
					return new _Application(response);
				})['catch'](function (errRes) {
					console.error('[MatterClient.apps().update()] Error updating app: ', errRes);
					return Promise.reject(errRes);
				});
			}

			//Delete an application
		}, {
			key: 'del',
			value: function del(appData) {
				return request['delete'](this.endpoint, appData).then(function (response) {
					console.log('[MatterClient.apps().del()] Apps:', response);
					return new _Application(response);
				})['catch'](function (errRes) {
					console.error('[MatterClient.apps().del()] Error deleting app: ', errRes);
					return Promise.reject(errRes);
				});
			}
		}, {
			key: 'getFiles',
			value: function getFiles() {
				return this.get().then(function (app) {
					app.getFiles().then(function (filesArray) {
						return filesArray;
					})['catch'](function (err) {
						console.error('[MatterClient.app().getFiles()] Error getting application files: ', err);
						return Promise.reject(err);
					});
				})['catch'](function (err) {
					console.error('[MatterClient.app().getFiles()] Error getting application: ', err);
					return Promise.reject(err);
				});
			}
		}, {
			key: 'getStructure',
			value: function getStructure() {
				return this.get().then(function (app) {
					return app.getStructure().then(function (structure) {
						console.log('Structure loaded: ', structure);
						return structure;
					})['catch'](function (err) {
						console.error('[MatterClient.app().getStructure()] Error getting application structure: ', err);
						return Promise.reject(err);
					});
				})['catch'](function (err) {
					console.error('[MatterClient.app().getStructure()] Error getting application: ', err);
					return Promise.reject(err);
				});
			}
		}]);

		return AppAction;
	})();

	var AppsAction = (function () {
		function AppsAction() {
			_classCallCheck(this, AppsAction);

			this.endpoint = config.serverUrl + '/apps';
		}

		/**
   * User class.
   *
   */

		//Get applications or single application

		_createClass(AppsAction, [{
			key: 'get',
			value: function get() {
				return request.get(this.endpoint).then(function (response) {
					console.log('[MatterClient.apps().get()] App(s) data loaded:', response);
					return response;
				})['catch'](function (errRes) {
					console.error('[MatterClient.apps().get()] Error getting apps list: ', errRes);
					return Promise.reject(errRes);
				});
			}

			//Add an application
		}, {
			key: 'add',
			value: function add(appData) {
				return request.post(this.endpoint, appData).then(function (response) {
					console.log('[MatterClient.apps().add()] Application added successfully: ', response);
					return new Application(response);
				})['catch'](function (errRes) {
					console.error('[MatterClient.getApps()] Error adding application: ', errRes);
					return Promise.reject(errRes);
				});
			}
		}]);

		return AppsAction;
	})();

	var User = (function () {
		function User(userData) {
			_classCallCheck(this, User);

			this.name = userData.name;
			this.username = userData.username;
			this.createdAt = userData.createdAt;
			this.updatedAt = userData.updatedAt;
		}

		//Actions for specific user

		_createClass(User, [{
			key: 'app',
			value: function app(appName) {
				//TODO: Attach owner as well ?
				return new AppAction(appName);
			}
		}, {
			key: 'apps',
			get: function get() {
				return new AppsAction();
			}
		}]);

		return User;
	})();

	var UserAction = (function () {
		function UserAction(userName) {
			_classCallCheck(this, UserAction);

			if (userName) {
				this.name = userName;
				this.endpoint = config.serverUrl + '/users/' + this.name;
			} else {
				console.error('Username is required to start an UserAction');
				throw new Error('Username is required to start an UserAction');
			}
		}

		//Actions for applications list

		//Get userlications or single userlication

		_createClass(UserAction, [{
			key: 'get',
			value: function get() {
				return request.get(this.endpoint).then(function (response) {
					console.log('[MatterClient.user().get()] App(s) data loaded:', response);
					return new User(response);
				})['catch'](function (errRes) {
					console.error('[MatterClient.user().get()] Error getting users list: ', errRes);
					return Promise.reject(errRes);
				});
			}

			//Update an userlication
		}, {
			key: 'update',
			value: function update(userData) {
				return request.put(this.endpoint, userData).then(function (response) {
					console.log('[MatterClient.users().update()] App:', response);
					return new User(response);
				})['catch'](function (errRes) {
					console.error('[MatterClient.users().update()] Error updating user: ', errRes);
					return Promise.reject(errRes);
				});
			}

			//Delete an userlication
			//TODO: Only do request if deleting personal account
		}, {
			key: 'del',
			value: function del(userData) {
				console.error('Deleting a user is currently disabled.');
				// return request.delete(this.endpoint, userData).then((response) => {
				// 	console.log('[MatterClient.users().del()] Apps:', response);
				// 	return new User(response);
				// })['catch']((errRes) => {
				// 	console.error('[MatterClient.users().del()] Error deleting user: ', errRes);
				// 	return Promise.reject(errRes);
				// });
			}
		}]);

		return UserAction;
	})();

	var UsersAction = (function () {
		function UsersAction() {
			_classCallCheck(this, UsersAction);

			this.endpoint = config.serverUrl + '/users';
		}

		/**Grout Client Class
   * @ description Extending matter provides token storage and login/logout/signup capabilities
   */

		//Get applications or single application

		_createClass(UsersAction, [{
			key: 'get',
			value: function get(query) {
				var userEndpoint = this.endpoint;
				if (query && !_.isString(query)) {
					var msg = 'Get only handles username as a string';
					console.error(msg);
					return Promise.reject({ message: msg });
				}
				if (query) {
					userEndpoint = userEndpoint + '/' + query;
				}
				return request.get(userEndpoint).then(function (response) {
					console.log('[MatterClient.apps().get()] App(s) data loaded:', response);
					return response;
				})['catch'](function (errRes) {
					console.error('[MatterClient.apps().get()] Error getting apps list: ', errRes);
					return Promise.reject(errRes);
				});
			}

			//Add an application
		}, {
			key: 'add',
			value: function add(appData) {
				return request.post(this.endpoint, appData).then(function (response) {
					console.log('[MatterClient.apps().add()] Application added successfully: ', response);
					return new Application(response);
				})['catch'](function (errRes) {
					console.error('[MatterClient.getApps()] Error adding application: ', errRes);
					return Promise.reject(errRes);
				});
			}

			//Search with partial of username
		}, {
			key: 'search',
			value: function search(query) {
				console.log('search called:', query);
				var searchEndpoint = this.endpoint + '/search/';
				if (query && _.isString(query)) {
					searchEndpoint += query;
				}
				console.log('searchEndpoint:', searchEndpoint);
				return request.get(searchEndpoint).then(function (response) {
					console.log('[MatterClient.users().search()] Users(s) data loaded:', response);
					return response;
				})['catch'](function (errRes) {
					console.error('[MatterClient.users().search()] Error getting apps list: ', errRes);
					return Promise.reject(errRes);
				});
			}
		}]);

		return UsersAction;
	})();

	var Grout = (function (_Matter) {
		_inherits(Grout, _Matter);

		//TODO: Use getter/setter to make this not a function

		function Grout() {
			_classCallCheck(this, Grout);

			//Call matter with tessellate
			_get(Object.getPrototypeOf(Grout.prototype), 'constructor', this).call(this, 'tessellate', { localServer: true });
		}

		//Start a new Apps Action

		_createClass(Grout, [{
			key: 'app',

			//Start a new App action
			value: function app(appName) {
				console.log('New AppAction:', new AppAction(appName));
				return new AppAction(appName);
			}

			//Start a new Users action
		}, {
			key: 'user',

			//Start a new User action
			value: function user(username) {
				return new UserAction(username);
			}
		}, {
			key: 'apps',
			get: function get() {
				console.log('New AppsAction:', new AppsAction());
				return new AppsAction();
			}
		}, {
			key: 'users',
			get: function get() {
				return new UsersAction();
			}
		}]);

		return Grout;
	})(Matter);

	;

	return Grout;
});
//# sourceMappingURL=grout.js.map