import mongoose from 'mongoose';
import url from 'url';
import _ from 'lodash';
import { Session } from '../models/session';

/**
 * @description Session controller functions
 */
/** Session Ctrl
 * @description Log an existing Session in
 * @params {String} email - Email of Session
 * @params {String} password - Password of Session
 */
export function get(req, res, next){
	var query = Session.find({});
	if(req.params.id){ //Get data for a specific Session
		logger.log({
			description: 'Session request.', id: req.params.id, func: 'get', obj: 'SessionCtrls'
		});
		query = Session.findById(req.params.id);
	}
	query.then((result) => {
		if(!result){
			logger.error({
				description: 'Session could not be found.', func: 'get', obj: 'SessionCtrls'
			});
			return res.status(400).send('Session could not be ended.');
		}
		res.send(result);
	}, (err) => {
		logger.error({
			description: 'Error querying session.', error: err, func: 'get', obj: 'SessionCtrls'
		});
		res.status(500).send('Error ending session.');
	});
};

/** Add Ctrl
 * @description Add a Session
 * @params {String} email - Email of Session
 * @params {String} password - Password of Session
 * @params {String} name - Name of Session
 * @params {String} title - Title of Session

 * @params {Boolean} tempPassword - Whether or not to set a temporary password (Also set if there is no password param)
 */
export function add(req, res, next){
	//Session does not already exist
	var Session = new Session(req.body);
	Session.save((result)  => {
		if(!result){
			logger.error({
				description: 'Session could not be added.',
				func: 'add', obj: 'SessionCtrls'
			});
			res.status(400).send('Session could not be created.');
		} else {
			res.json(result);
		}
	}, (err) => {
		logger.error({
			description: 'Error saving session.',
			error: err, func: 'add', obj: 'SessionCtrls'
		});
		res.status(500).send('Error starting new session.');
	});
};
/** Update Ctrl
 * @description Update a Session
 * @params {String} email - Email of Session
 * @params {String} Sessionname - Sessionname of Session
 * @params {String} password - Password of Session
 * @params {String} name - Name of Session
 * @params {String} title - Title of Session
 */
export function update(req, res, next){
	Session.update({_id:req.id}, req.body, {upsert:true},  (err, numberAffected, result)  => {
		if(err) {
			logger.error({
				description: 'Error updating session.',
				error: err, func: 'update', obj: 'SessionCtrls'
			});
			return res.status(500).send('Error updating session.');
		}
		if(!result){
			logger.error({
				description: 'Session could not be updated.',
				func: 'update', obj: 'SessionCtrls'
			});
			return res.status(400).send('Session could not be updated.');
		}
		res.json(result);
	});
};
/** Delete Ctrl
 * @description Delete a Session
 * @params {String} email - Email of Session
 */
export function del(req, res, next){
	var urlParams = url.parse(req.url, true).query;
	var query = Session.findOneAndRemove({'_id':req.params.id}); // find and delete using id field
	query.then((result) => {
		if(!result){
			logger.error({
				description: 'Sessiong could not be deleted.',
				func: 'delete', obj: 'SessionCtrls'
			});
			return res.status(400).send('Session could not be deleted.');
		}
		res.json(result);
	}, (err) => {
		logger.error({
			description: 'Error deleting session.',
			error: err, func: 'delete', obj: 'SessionCtrls'
		});
		res.status(500).send('Error deleting session.');
	});
};
