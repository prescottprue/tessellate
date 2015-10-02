var conf = require('../config/default').config;
var _ = require('underscore');

var winston = require('winston');
require('winston-loggly');

 winston.add(winston.transports.Loggly, {
    token: "917b3078-a651-408e-8f36-07562e96a4dc",
    subdomain: "kyper",
    tags: ["Winston-NodeJS"],
    json:true
});
exports.log = function(logData){
  logData.env = conf.envName;
	var msgStr = buildMessageStr(logData);
	if(conf.envName === 'local'){
    console.log(msgStr);
    winston.log('log', logData);
	} else if (conf.envName === 'production') {
		console.log(msgStr);
    winston.log('log', logData);
	} else {
    console.log(msgStr);
    winston.log('log', logData);
	}
};
exports.info = function(logData){
  logData.env = conf.envName;
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.log(msgStr);
    winston.log('info', logData);
	} else if (conf.envName === 'production') {
		console.info(logData) || console.log(logData);
    winston.log('info', logData);
	} else {
		console.log(msgStr);
    winston.log('info', logData);
	}
};
exports.debug = function(logData){
  logData.env = conf.envName;
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.log(msgStr);
	} else if (conf.envName === 'production') {
		console.info(logData) || console.log(logData);
    winston.log('debug', logData);
	} else {
		console.log(msgStr);
    winston.log('debug', logData);
	}
};
exports.warn = function(logData){
  logData.env = conf.envName;
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.warn(msgStr);
	} else if (conf.envName === 'production') {
		console.warn(logData) || console.log(logData);
    winston.log('warn', logData);
	} else {
		console.warn(msgStr);
    winston.log('warn', logData);
	}
};
exports.error = function(logData){
  logData.env = conf.envName;
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.error(msgStr);
	} else if (conf.envName === 'production') {
		console.error(logData) || console.log(logData);
    winston.log('error', logData);
	} else {
		console.error(msgStr);
    winston.log('error', logData);
	}
};
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
