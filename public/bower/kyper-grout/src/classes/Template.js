import config from '../config';
import matter from './Matter';
import _ from 'lodash';

let request = matter.utils.request;
let logger = matter.utils.logger;
//Actions for specific user
class Template {
	constructor(templateData) {
		//Call matter with name and settings
		if (templateData && _.isString(templateData)) {
			this.name = templateData;
		} else {
			logger.error({description: 'Template data is required to start a Template action.', func: 'construcotr', obj: ''});
			throw new Error('Template data is required to start a Template action.');
		}
	}
	get templateEndpoint() {
		return `${matter.endpoint}/templates/${this.name}`;
	}
	//Get userlications or single userlication
	get() {
		logger.log({description: 'Get template called.', name: this.name, func: 'get', obj: 'Template'});
		return request.get(this.templateEndpoint).then((response) => {
			logger.log({description: 'Get template responded.', response: response, func: 'get', obj: 'Template'});
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error getting template.', error: errRes, func: 'get', obj: 'Template'});
			return Promise.reject(errRes);
		});
	}
	//Update an userlication
	update(templateData) {
		logger.log({description: 'Update template called.', templateData: templateData, func: 'update', obj: 'Template'});
		return request.put(this.templateEndpoint, templateData).then((response) => {
			logger.log({description: 'Update template responded.', response: response, templateData: templateData, func: 'update', obj: 'Template'});
			//TODO: Return template object
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error updating template.', error: errRes, func: 'update', obj: 'Template'});
			return Promise.reject(errRes);
		});
	}
	//Delete a template
	del(templateData) {
		logger.log({description: 'Delete template called.', templateData: templateData, func: 'del', obj: 'Template'});
		return request.delete(this.endpoint, templateData).then((response) => {
			logger.log({description: 'Template deleted successfully.', response: response, func: 'del', obj: 'Template'});
			//TODO: Return template object
			return response;
		})['catch']((errRes) => {
			logger.error({description: 'Error deleting template.', error: errRes, func: 'del', obj: 'Template'});
			return Promise.reject(errRes);
		});
	}
}

export default Template;
