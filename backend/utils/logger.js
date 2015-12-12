/**
 * @description Logger utility that handles Internal and external logging based on environment config
 */
var conf = require('../config/default').config;
var _ = require('underscore');
var winston = require('winston');
require('winston-loggly');
var externalLoggerExists = null;

configureExternalLogger();
// TODO: Handle log level

exports.log = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName === 'local'){
    console.log(msgStr);
	} else if (conf.envName === 'production') {
		console.log(msgStr);
    callExternalLogger('log', logData);
	} else {
    console.log(msgStr);
    // callExternalLogger('log', logData);
	}
};
exports.info = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.log(msgStr);
	} else if (conf.envName === 'production') {
		console.info(logData) || console.log(logData);
    callExternalLogger('info', logData);
	} else {
		console.log(msgStr);
    // callExternalLogger('info', logData);
	}
};
exports.debug = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.log(msgStr);
	} else if (conf.envName === 'production') {
		console.info(logData) || console.log(logData);
    callExternalLogger('debug', logData);
	} else {
		console.log(msgStr);
    callExternalLogger('debug', logData);
	}
};
exports.warn = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.warn(msgStr);
	} else if (conf.envName === 'production') {
		console.warn(logData) || console.log(logData);
    callExternalLogger('warn', logData);
	} else {
		console.warn(msgStr);
    callExternalLogger('warn', logData);
	}
};
exports.error = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.error(msgStr);
	} else if (conf.envName === 'production') {
		console.error(logData) || console.log(logData);
    callExternalLogger('error', logData);
	} else {
		console.error(msgStr);
    callExternalLogger('error', logData);
	}
};
/**
 * @description Build a message string based on multiple types of logdata. String is human reading and includes line breaks.
 * @param {object|string} logData - Object or string containing a log to be turned into a string.
 * @param {object} logData.func - Function where the log is occuring
 * @param {object} logData.obj - Object that contains the function where the log is occuring.
 */
function buildMessageStr(logData){
	var msg = "";
	//TODO: Attach time stamp
	if(_.isObject(logData)){
		if(_.has(logData, 'obj') && _.has(logData, 'func')){
			msg += '[' + logData.obj + '.' + logData.func + '()] ';
		}
		//Print each key and its value other than obj and func
		_.each(_.omit(_.keys(logData), 'obj', 'func'), function(key, ind, list){
			if(_.isString(logData[key])){
				msg += key + ': ' + logData[key] + ', ';
			} else {
				//Print objects differently
				msg += key + ': ' + JSON.stringify(logData[key]) + ', ';
			}
			if(ind != list.length - 1){
				msg += '\n';
			}
		});
	} else if (_.isString(logData)){
		msg = logData;
	}
	return msg + '\n';
}
/**
 * @description Configure external logging server.
 * Currently using Loggly through winston. Requires LOGGLY_TOKEN environment variable
 */
function configureExternalLogger(){
  if(conf.logging && conf.logging.enabled){
		if(!_.has(process.env, 'LOGGLY_TOKEN')){
			console.warn('Loggly Token does not exist, so external logging can not be configured.');
			externalLoggerExists = false;
			return;
		}
		externalLoggerExists = true;
		winston.add(winston.transports.Loggly, {
			token: process.env.LOGGLY_TOKEN,
			subdomain: "kyper",
			tags: ["Winston-NodeJS"],
			json:true
		});
	} else {
		console.log('External logging is disabled.');
		externalLoggerExists = false;
	}
}
/**
 * @description Call external logging service with loggin type.
 * @param {string} type - Type of log.
 * @param {object|string} msgData - Object or String data of message to log.
 */
function callExternalLogger(type, msgData) {
	try {
		console[type](msgData);
		externalLoggerExists ? winston.log(type, msgData) : console.log('External logging does not exist.');
	} catch(err){
		console.log('ERROR: External logging failed.');
		console.log(JSON.stringify(err));
	}
}
