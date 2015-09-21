import config from '../config';
import _ from 'lodash';
import matter from '../classes/Matter';
let logger = matter.utils.logger;
let request = matter.utils.request;

//Actions for templates list
class TemplatesAction {
	get templatesEndpoint() {
		let endpointArray = [matter.endpoint, 'templates'];
		//Check for app groups action
		if (_.has(this, 'app') && _.has(this.app, 'name')) {
			// endpointArray.splice(1, 0, 'apps', this.app.name);
			logger.log({description: 'Templates action is not currently supported for a specific application.', func: 'accountsEndpoint', obj: 'AccountsAction'});
		}
		//Create string from endpointArray
		let endpointStr = endpointArray.join('/');
		logger.log({description: 'Templates endpoint built.', endpoint: endpointStr, func: 'templatesEndpoint', obj: 'TemplatesAction'});
		return endpointStr;
	}
	//Get templates or single application
	get() {
		logger.log({description: 'Get template called.', func: 'get', obj: 'TemplatesAction'});
		return request.get(this.templatesEndpoint).then((response) => {
			logger.log({description: 'Templates loaded.', response: response, func: 'get', obj: 'TemplatesAction'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error getting templates.', error: errRes, func: 'get', obj: 'TemplatesAction'});
			return Promise.reject(errRes);
		});
	}
	//Add an application
	add(appData) {
		logger.log({description: 'Add template called.', func: 'add', obj: 'TemplatesAction'});
		return request.post(this.templatesEndpoint, appData).then((response) => {
			logger.log({description: 'Templates added successfully.', func: 'add', obj: 'TemplatesAction'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error adding template.', error: errRes, func: 'add', obj: 'TemplatesAction'});
			return Promise.reject(errRes);
		});
	}
	//Search with partial of username
	search(query) {
		logger.log({description: 'Search template called.', query: query, func: 'search', obj: 'TemplatesAction'});
		var searchEndpoint = this.templatesEndpoint + '/search/';
		if (query && _.isString(query)) {
			searchEndpoint += query;
		}
		logger.log({description: 'Search endpoint created.', endpoint: searchEndpoint, func: 'search', obj: 'TemplatesAction'});
		return request.get(searchEndpoint).then((response) => {
			logger.log({description: 'Template(s) found successfully.', response: response, endpoint: searchEndpoint, func: 'search', obj: 'TemplatesAction'});
			return response;
		})['catch']((errRes) => {
			logger.log({description: 'Error searching for templates.', query: query, error: errRes, endpoint: searchEndpoint, func: 'search', obj: 'TemplatesAction'});
			return Promise.reject(errRes);
		});
	}
}
export default TemplatesAction;
