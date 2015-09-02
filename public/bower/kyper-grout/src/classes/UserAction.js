import config from '../config';
import request from '../utils/request';
import User from './User';

//Actions for specific user
class UserAction {
	constructor(userName) {
		if (userName) {
			this.name = userName;
			this.endpoint = `${config.serverUrl}/users/${this.name}`;
		} else {
			console.error('Username is required to start an UserAction');
			throw new Error('Username is required to start an UserAction');
		}
	}
	//Get userlications or single userlication
	get() {
		return request.get(this.endpoint).then((response) => {
			console.log('[MatterClient.user().get()] App(s) data loaded:', response);
			return new User(response);
		})['catch']((errRes) => {
			console.error('[MatterClient.user().get()] Error getting users list: ', errRes);
			return Promise.reject(errRes);
		});
	}
	//Update an userlication
	update(userData) {
		return request.put(this.endpoint, userData).then((response) => {
			console.log('[MatterClient.users().update()] App:', response);
			return new User(response);
		})['catch']((errRes) => {
			console.error('[MatterClient.users().update()] Error updating user: ', errRes);
			return Promise.reject(errRes);
		});
	}
	//Delete an userlication
	//TODO: Only do request if deleting personal account
	del(userData) {
		console.error('Deleting a user is currently disabled.');
		// return request.delete(this.endpoint, userData).then((response) => {
		// 	console.log('[MatterClient.users().del()] Apps:', response);
		// 	return new User(response);
		// })['catch']((errRes) => {
		// 	console.error('[MatterClient.users().del()] Error deleting user: ', errRes);
		// 	return Promise.reject(errRes);
		// });
	}
}

export default UserAction;
