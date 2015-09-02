import config from './config';
import logger from './utils/logger';
import request from './utils/request';
import token from './utils/token';
import envStorage from './utils/envStorage';
import _ from 'lodash';

let user;
let endpoints;

class Matter {
	/* Constructor
	 * @param {string} appName Name of application
	 */
	constructor(appName, opts) {
		if (!appName) {
			logger.error({description: 'Application name requires to use Matter.', func: 'constructor', obj: 'Matter'});
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
	get endpoint() {
		let serverUrl = config.serverUrl;
		if (_.has(this, 'options') && this.options.localServer) {
			serverUrl = 'http://localhost:4000';
			logger.info({description: 'LocalServer option was set to true. Now server url is local server.', url: serverUrl, func: 'endpoint', obj: 'Matter'});
		}
		if (this.name == 'tessellate') {
			//Remove url if host is server
			if (window && _.has(window, 'location') && window.location.host == serverUrl) {
				serverUrl = '';
				logger.info({description: 'Host is Server, serverUrl simplified!', url: serverUrl, func: 'endpoint', obj: 'Matter'});
			}
		} else {
			serverUrl = config.serverUrl + '/apps/' + this.name;
			logger.info({description: 'Server url set.', url: serverUrl, func: 'endpoint', obj: 'Matter'});
		}
		return serverUrl;
	}
	/* Signup
	 *
	 */
	signup(signupData) {
		return request.post(this.endpoint + '/signup', signupData)
		.then((response) => {
			logger.log({description: 'Account request successful.', signupData: signupData, response: response, func: 'signup', obj: 'Matter'});
			if (_.has(response, 'account')) {
				return response.account;
			} else {
				logger.warn({description: 'Account was not contained in signup response.', signupData: signupData, response: response, func: 'signup', obj: 'Matter'});
				return response;
			}
		})
		['catch']((errRes) => {
			logger.error({description: 'Error requesting signup.', signupData: signupData, error: errRes, func: 'signup', obj: 'Matter'});
			return Promise.reject(errRes);
		});
	}
	/** Login
	 *
	 */
	login(loginData) {
		if (!loginData || !loginData.password || !loginData.username) {
			logger.error({description: 'Username/Email and Password are required to login', func: 'login', obj: 'Matter'});
			return Promise.reject({message: 'Username/Email and Password are required to login'});
		}
		return request.put(this.endpoint + '/login', loginData)
		.then((response) => {
			if (_.has(response, 'data') && _.has(response.data, 'status') && response.data.status == 409) {
				logger.warn({description: 'Account not found.', response: response, func: 'login', obj: 'Matter'});
				return Promise.reject(response.data);
			} else {
				logger.log({description: 'Successful login.', response: response, func: 'login', obj: 'Matter'});
				if (_.has(response, 'token')) {
					this.token.string = response.token;
				}
				if (_.has(response, 'account')) {
					this.storage.setItem('currentUser');
				}
				return response.account;
			}
		})['catch']((errRes) => {
			logger.error({description: 'Error requesting login.', error: errRes, status: errRes.status,  func: 'login', obj: 'Matter'});
			if (errRes.status == 409 || errRes.status == 400) {
				errRes = errRes.response.text;
			}
			return Promise.reject(errRes);
		});
	}
	/** Logout
	 */
	logout() {
		return request.put(this.endpoint + '/logout').then((response) => {
			logger.log({description: 'Logout successful.', response: response, func: 'logout', obj: 'Matter'});
			this.storage.removeItem('currentUser');
			this.token.delete();
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error requesting log out: ', error: errRes, func: 'logout', obj: 'Matter'});
			this.storage.removeItem('currentUser');
			this.token.delete();
			return Promise.reject(errRes);
		});
	}
	get currentUser() {
		if (this.storage.item('currentUser')) {
			//TODO: Check to see if this comes back as a string
			return Promise.resove(this.storage.item('currentUser'));
		} else {
			return request.get(this.endpoint + '/user').then((response) => {
				//TODO: Save user information locally
				logger.log({description: 'Current User Request responded.', responseData: response.data, func: 'currentUser', obj: 'Matter'});
				this.currentUser = response.data;
				return response.data;
			})['catch']((errRes) => {
				logger.error({description: 'Error requesting current user.', error: errRes, func: 'currentUser', obj: 'Matter'});
				return Promise.reject(errRes);
			});
		}
	}
	get storage() {
		return envStorage;
	}
	get token() {
		return token;
	}
	get isLoggedIn() {
		return this.token.string ? true : false;
	}
};
export default Matter;
