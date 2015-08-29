var conf = require('../config/default').config;
var _ = require('underscore');

exports.log = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.log(msgStr);
	} else {
		console.log(msgStr);
	}
};
exports.info = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.log(msgStr);
	} else {
		console.log(msgStr);
	}
};
exports.debug = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.log(msgStr);
	} else {
		console.log(msgStr);
	}
};
exports.warn = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.warn(msgStr);
	} else {
		console.warn(msgStr);
	}
};
exports.error = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.error(msgStr);
	} else {
		console.error(msgStr);
	}
};
function buildMessageStr(logData){
	var msg = "";
	//TODO: Attach time stamp
	if(_.isObject(logData)){
		if(_.has(logData, 'file') && _.has(logData, 'func')){
			msg += '[' + logData.file + '.' + logData.func + '()] ';
		}
		//Print each key and its value other than file and func
		_.each(_.omit(_.keys(logData), 'file', 'func'), function(key){
			msg += ', ' + key + '=' + logData[key];
		});
	}
	return msg;
}