import config from '../config';
import matter from '../classes/Matter';

let request = matter.utils.request;
let logger = matter.utils.logger;

//Actions for applications list
class AppsAction {
	constructor() {
		//Call matter with name and settings
	}
	get appsEndpoint() {
		return `${matter.endpoint}/apps`;
	}
	//Get applications or single application
	get() {
		logger.debug({description: 'Apps get called.', action: this, func: 'get', obj: 'AppsAction'});
		return request.get(this.appsEndpoint).then((response) => {
			logger.info({description: 'Apps data loaded successfully.', response: response, func: 'get', obj: 'AppsAction'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error getting apps data.', error: errRes, func: 'get', obj: 'AppsAction'});
			return Promise.reject(errRes);
		});
	}
	//Add an application
	add(appData) {
		logger.debug({description: 'Application add called.', appData: appData, func: 'add', obj: 'AppsAction'});
		return matter.utils.request.post(this.appsEndpoint, appData).then((response) => {
			logger.info({description: 'Application added successfully.', response: response, func: 'add', obj: 'AppsAction'});
			return new Application(response);
		})['catch']((errRes) => {
			logger.error({description: 'Error adding app.', error: errRes, func: 'add', obj: 'AppsAction'});
			return Promise.reject(errRes);
		});
	}
}
export default AppsAction;
