//Interface with amazons messaging service
var AWS = require('aws-sdk');
var sqsQueueUrl = 'https://sqs.us-east-1.amazonaws.com/823322155619/TemplateCopying';
var q = require('q'), sqs;

var sourceS3Conf = new AWS.Config({
	region:'us-east-1',
  accessKeyId: process.env.HYPERCUBE_S3_KEY || "",
  secretAccessKey: process.env.HYPERCUBE_S3_SECRET || ""
});
    AWS.config.update({
      accessKeyId: process.env.HYPERCUBE_S3_KEY|| process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.HYPERCUBE_S3_SECRET || process.env.AWS_SECRET_KEY,
      region: 'us-east-1'
    });
// Instantiate SQS client
sqs = new AWS.SQS();

exports.doOnReceive = function(action){
	return receiveMessage(action);
};

exports.add = function(body, attrs){
	//action, src, dest, author
	var d = q.defer();
	var params = {
    MessageBody: body,
    QueueUrl: sqsQueueUrl,
    DelaySeconds: 0,
    MessageAttributes:{
    }
  };
  sqs.sendMessage(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      d.reject(err);
    }
    else {
      d.resolve(data);
    };
  });
  return d.promise;
};

function sendMessage(messageBody, messageAttrs){
	//action, src, dest, author
	var d = q.defer();
	 var params = {
    MessageBody: messageBody,
    QueueUrl: sqsQueueUrl,
    DelaySeconds: 0,
    MessageAttributes:{

    }
  };
  sqs.sendMessage(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      d.reject(err);
    } // an error occurred
    else {
      console.log('Victory, message sent for ' + encodeURIComponent(request.params.name) + '!');
      d.resolve(data);
    };
  });
  return d.promise;
}

function receiveMessage(actionPromise){
	var d = q.defer();
	sqs.receiveMessage({
  	QueueUrl: sqsQueueUrl,
  	MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
  	VisibilityTimeout: 60, // seconds - how long we want a lock on this job
  	WaitTimeSeconds: 3 // seconds - how long should we wait for a message?
	}, function(err, data) {
   // If there are any messages to get
   if (data.Messages) {
    // Get the first message (should be the only one since we said to only get one above)
    var message = data.Messages[0];
    var body = JSON.parse(message.Body);
    //TODO: Check that actionPromise is a function and returns a promise
    // Now this is where you'd do something with this message
    q.all([actionPromise(message, body), removeFromQueue(message)]).then(function(){
    	console.log('Action completed and message removed');
    	d.resolve(message);
    }, function(err){
    	d.reject(err);
    });
   }
 });
	return d.promise;
}
function removeFromQueue(message) {
	var q = q.defer();
  sqs.deleteMessage({
    QueueUrl: sqsQueueUrl,
    ReceiptHandle: message.ReceiptHandle
  }, function(err, data) {
    // If we errored, tell us that we did
    err && console.log(err);
   });
};