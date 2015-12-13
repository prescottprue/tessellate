'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.add = add;

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _default = require('../config/default');

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Interface with Amazon's queue/messaging service

var sqs = configureSQS();
//Add message to SQS queue (will be consumed by worker)
function add(body, attrs) {
	//action, src, dest, author
	var params = {
		MessageBody: body,
		QueueUrl: _default.config.aws.sqsQueueUrl,
		DelaySeconds: 0,
		MessageAttributes: {}
	};
	return sqs.sendMessage(params, function (err, data) {
		if (err) {
			console.log(err, err.stack);
			return Promise.reject(err);
		} else {
			return Promise.resolve(data);
		};
	});
};
//Configure SQS
function configureSQS() {
	if (!_lodash2.default.has(_default.config.aws, 'sqsQueueUrl')) {
		_logger2.default.error({ description: 'SQS_QUEUE_URL environment variable not set. SQS will not be available.', func: 'configureSQS', file: 'sqs' });
		return;
	}
	if (!_lodash2.default.has(_default.config.aws, 'key') || !_lodash2.default.has(_default.config.aws, 'secret')) {
		_logger2.default.error({ description: 'AWS Environment variables not set. SQS will not be available.', func: 'configureSQS', file: 'sqs' });
		return;
	}
	var sourceS3Conf = new _awsSdk2.default.Config({
		accessKeyId: _default.config.aws.key,
		secretAccessKey: _default.config.aws.secret,
		region: 'us-east-1'
	});
	_awsSdk2.default.config.update({
		accessKeyId: _default.config.aws.key,
		secretAccessKey: _default.config.aws.secret,
		region: 'us-east-1'
	});
	// Instantiate SQS client
	return new _awsSdk2.default.SQS();
}
// exports.doOnReceive = (action) => {
// 	return receiveMessage(action);
// };
//
// function sendMessage(messageBody, messageAttrs){
// 	//action, src, dest, author
// 	 var params = {
//     MessageBody: messageBody,
//     QueueUrl: sqsQueueUrl,
//     DelaySeconds: 0,
//     MessageAttributes:{
//     }
//   };
//   return sqs.sendMessage(params, (err, data) => {
//     if (err) {
//       console.log(err, err.stack);
//       return Promise.reject(err);
//     } // an error occurred
//     else {
//       console.log('Victory, message sent for ' + encodeURIComponent(request.params.name) + '!');
//       return Promise.resolve(data);
//     };
//   });
// }
//
// function receiveMessage(actionPromise){
// 	return sqs.receiveMessage({
//   	QueueUrl: sqsQueueUrl,
//   	MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
//   	VisibilityTimeout: 60, // seconds - how long we want a lock on this job
//   	WaitTimeSeconds: 3 // seconds - how long should we wait for a message?
// 	},  (err, data) => {
//    // If there are any messages to get
//    if (data.Messages) {
//     // Get the first message (should be the only one since we said to only get one above)
//     var message = data.Messages[0];
//     var body = JSON.parse(message.Body);
//     //TODO: Check that actionPromise is a function and returns a promise
//     // Now this is where you'd do something with this message
//     Promise.all([actionPromise(message, body), removeFromQueue(message)]).then(() => {
//     	console.log('Action completed and message removed');
//     	return Promise.resolve(message);
//     }, function(err){
//     	return Promise.reject(err);
//     });
//    }
//  });
// }
// function removeFromQueue(message) {
// 	var q = q.defer();
//   return sqs.deleteMessage({
//     QueueUrl: sqsQueueUrl,
//     ReceiptHandle: message.ReceiptHandle
//   }, (err, data) => {
//     // If we errored, tell us that we did
//     console.log(err);
// 		return Promise.reject(err);
//   });
// };