import config from '../config';
import request from './request';
import logger from './logger';
import dom from './dom';
import _ from 'lodash';
// import hello from 'hellojs'; //After es version of module is created
//Private object containing clientIds
let clientIds = {};

class ProviderAuth {
	constructor(actionData) {
		this.app = actionData.app ? actionData.app : null;
		this.redirectUri = actionData.redirectUri ? actionData.redirectUri : 'redirect.html';
		this.provider = actionData.provider ? actionData.provider : null;
	}
	get loadHello() {
		//Load hellojs script
		//TODO: Replace this with es6ified version
		if (window && !window.hello) {
			return dom.asyncLoadJs('https://s3.amazonaws.com/kyper-cdn/js/hello.js');
		} else {
			return Promise.resolve();
		}
	}
	get helloLoginListener() {
		//Login Listener
		window.hello.on('auth.login', (auth) => {
		logger.info({description: 'User logged in to google.', func: 'loadHello', obj: 'Google'});
			// Call user information, for the given network
			window.hello(auth.network).api('/me').then(function(r) {
				// Inject it into the container
				//TODO:Send account informaiton to server
				var userData = r;
				userData.provider = auth.network;
				//Login or Signup endpoint
				return request.post(this.endpoint + '/provider', userData)
					.then((response) => {
						logger.log({description: 'Provider request successful.',  response: response, func: 'signup', obj: 'GoogleUtil'});
						return response;
					})
					['catch']((errRes) => {
						logger.error({description: 'Error requesting login.', error: errRes, func: 'signup', obj: 'Matter'});
						return Promise.reject(errRes);
					});
			});
		});
	}
	get initHello() {
		return this.loadHello.then(() => {
			return request.get(this.app.endpoint)
		.then((response) => {
			logger.log({description: 'Provider request successful.',  response: response, func: 'signup', obj: 'ProviderAuth'});
			var provider = _.findWhere(response.providers, {name: this.provider});
			logger.warn({description: 'Provider found', findWhere: provider , func: 'login', obj: 'ProviderAuth'});
			if (!provider) {
				logger.error({description: 'Provider is not setup. Visit tessellate.kyper.io to enter your client id for ' + this.provider, provider: this.provider, clientIds: clientIds, func: 'login', obj: 'ProviderAuth'});
				return Promise.reject({message: 'Provider is not setup.'});
			}
			var providersConfig = {};
			providersConfig[provider.name] = provider.clientId;
			logger.warn({description: 'Providers config built', providersConfig: providersConfig, func: 'login', obj: 'ProviderAuth'});
				return window.hello.init(providersConfig, {redirect_uri: this.redirectUri});
			})
			['catch']((errRes) => {
				logger.error({description: 'Getting application data.', error: errRes, func: 'signup', obj: 'Matter'});
				return Promise.reject(errRes);
			});
		});
	}
	login() {
		//Initalize Hello
		return this.initHello.then(() => {
			if (window) {
				return window.hello.login(this.provider);
			}
		});
	}
	signup() {
		//Initalize Hello
		if (!_.has(clientIds, this.provider)) {
			logger.error({description: `${this.provider} is not setup as a provider on Tessellate. Please visit tessellate.kyper.io to enter your provider information.`, provider: this.provider, clientIds: clientIds, func: 'login', obj: 'ProviderAuth'});
			return Promise.reject();
		}
		return this.initHello.then(() => {
			if (window) {
				return window.hello.login(this.provider);
			}
		});
	}
}
export default ProviderAuth;
