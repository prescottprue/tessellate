var conf = require('../config/default').config;
var _ = require('underscore');

exports.log = function(logData){
	var msgStr = buildMessageStr(logData);
	if(conf.envName == 'local'){
		console.log(logData);
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
		if(_.has(logData, 'obj') && _.has(logData, 'func')){
			msg += '[' + logData.obj + '.' + logData.func + '()] ';
		}
		//Print each key and its value other than obj and func
		_.each(_.omit(_.keys(logData), 'obj', 'func'), function(key, ind, list){
			if(_.isString(logData[key])){
				msg += key + ': ' + logData[key] + ', ';
			} else {
				//Print objects differently
				msg += key + ': ' + logData[key] + ', ';
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