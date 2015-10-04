//Interface with amazons messaging service
var AWS = require('aws-sdk');
var _ = require('lodash');
var conf = require('../config/default').config;
var logger = require('./logger');

var sqs = configureSQS();
//Add message to SQS queue (will be consumed by worker)
exports.add = (body, attrs) => {
	//action, src, dest, author
	var params = {
    MessageBody: body,
    QueueUrl: conf.aws.sqsQueueUrl,
    DelaySeconds: 0,
    MessageAttributes:{
    }
  };
  return sqs.sendMessage(params, (err, data)  => {
    if (err) {
      console.log(err, err.stack);
			return Promise.reject(err);
    }
    else {
      return Promise.resolve(data);
    };
  });
};
//Configure SQS
function configureSQS() {
	if(!_.has(conf.aws, 'sqsQueueUrl')) {
		logger.error({description: 'SQS_QUEUE_URL environment variable not set. SQS will not be available.', func: 'configureSQS', file: 'sqs'});
		return;
	}
	if(!_.has(conf.aws, 'key') || !_.has(conf.aws, 'secret')) {
		logger.error({description: 'AWS Environment variables not set. SQS will not be available.', func: 'configureSQS', file: 'sqs'});
		return;
	}
	var sourceS3Conf = new AWS.Config({
	  accessKeyId: conf.aws.key,
	  secretAccessKey: conf.aws.secret,
		region:'us-east-1'
	});
	AWS.config.update({
	  accessKeyId: conf.aws.key,
	  secretAccessKey: conf.aws.secret,
	  region: 'us-east-1'
	});
	// Instantiate SQS client
	return new AWS.SQS();
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
