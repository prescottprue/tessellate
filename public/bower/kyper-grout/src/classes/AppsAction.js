import config from '../config';
import request from '../utils/request';

//Actions for applications list
class AppsAction {
	constructor() {
		this.endpoint = config.serverUrl + '/apps';
	}
	//Get applications or single application
	get() {
		return request.get(this.endpoint).then((response) => {
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
}
export default AppsAction;
