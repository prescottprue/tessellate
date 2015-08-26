/**
 * @description Admin Controller
 */
var Application = require('../models/application').Application;
var mongoose = require('mongoose');
var url = require('url');
var _ = require('underscore');
var q = require('q');
var fileStorage = require('../lib/fileStorage');
/**
 * @api {get} /admin/buckets Get Buckets
 * @apiDescription Get list of buckets.
 * @apiName GetBuckets
 * @apiGroup Admin
 *
 * @apiParam {String} name Name of bucket to delete
 *
 * @apiPermission Administrator
 *
 * @apiSuccess {Array} buckets List of buckets
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *      {
 *        bucketName:"hypercube-exampleApp",
 *        siteUrl:"hypercube-exampleApp.s3-website-us-east-1.amazonaws.com",
 *        bucketUrl:"hypercube-exampleApp.s3.amazonaws.com"
 *        provider:"Amazon"
 *      },
 *      {
 *        bucketName:"hypercube-testApp",
 *        siteUrl:"hypercube-testApp.s3-website-us-east-1.amazonaws.com",
 *        bucketUrl:"hypercube-testApp.s3.amazonaws.com"
 *        provider:"Amazon"
 *      },
 *     ]
 *
 */
exports.getBuckets = function(req, res, next){
	fileStorage.getBuckets().then(function(buckets){
		console.log("buckets");
		res.send(buckets);
	}, function(err){
		res.status(500).send(err);
	})
};
/**
 * @api {delete} /admin/buckets Delete Bucket
 * @apiDescription Delete a bucket.
 * @apiName DeleteBucket
 * @apiGroup Admin
 *
 * @apiPermission Administrator
 *
 * @apiSuccess {Object} deletedBucket Bucket that was deleted
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {url:"hypercube-exampleApp.s3.amazonaws.com"}
 *
 */
exports.deleteBucket = function(req, res, next){
	if(!_.has(req.body, 'name')){
		res.status(400).send('Bucket name required to delete bucket');
	} else {
		fileStorage.deleteBucket(req.body.name).then(function(bucket){
			console.log("Bucket deleted successfully");
			res.send(bucket);
		}, function(err){
			res.status(500).send(err);
		});
	}
};
