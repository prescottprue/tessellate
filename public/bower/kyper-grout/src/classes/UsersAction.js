import config from '../config';
import request from '../utils/request';
import _ from 'lodash';

//Actions for applications list
class UsersAction {
	constructor() {
		this.endpoint = config.serverUrl + '/users';
	}
	//Get applications or single application
	get(query) {
		let userEndpoint = this.endpoint;
		if (query && !_.isString(query)) {
			const msg = 'Get only handles username as a string';
			console.error(msg);
			return Promise.reject({message: msg});
		}
		if (query) {
		 userEndpoint = userEndpoint + '/' + query;
		}
		return request.get(userEndpoint).then((response) => {
			console.log('[MatterClient.apps().get()] App(s) data loaded:', response);
			return response;
		})['catch']((errRes) => {
			console.error('[MatterClient.apps().get()] Error getting apps list: ', errRes);
			return Promise.reject(errRes);
		});
	}
	//Add an application
	add(appData) {
		return request.post(this.endpoint, appData).then((response) => {
			console.log('[MatterClient.apps().add()] Application added successfully: ', response);
			return new Application(response);
		})['catch']((errRes) => {
			console.error('[MatterClient.getApps()] Error adding application: ', errRes);
			return Promise.reject(errRes);
		});
	}
	//Search with partial of username
	search(query) {
		console.log('search called:', query);
		var searchEndpoint = this.endpoint + '/search/';
		if (query && _.isString(query)) {
			searchEndpoint += query;
		}
		console.log('searchEndpoint:', searchEndpoint);
		return request.get(searchEndpoint).then((response) => {
			console.log('[MatterClient.users().search()] Users(s) data loaded:', response);
			return response;
		})['catch']((errRes) => {
			console.error('[MatterClient.users().search()] Error getting apps list: ', errRes);
			return Promise.reject(errRes);
		});
	}
}
export default UsersAction;
