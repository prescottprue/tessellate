/**
 * @description Admin Controller
 */
import logger from '../utils/logger';
import * as fileStorage from '../utils/fileStorage';
import { Application } from '../models/project';

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
export function getBuckets(req, res, next) {
	//TODO: Limit/paginate number of buckets returned
	fileStorage.getBuckets().then((buckets) => {
		logger.log({
			description: 'Buckets loaded.', buckets: buckets,
			func: 'getBuckets', obj: 'AdminCtrls'
		});
		res.send(buckets);
	}, (err) => {
		logger.error({
			description: 'Error getting buckets:',
			error: err, func: 'getBuckets', obj: 'AdminCtrls'
		});
		res.status(500).send('Error getting buckets.');
	});
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
export function deleteBucket(req, res, next) {
	if(!_.has(req.body, 'name')){
		res.status(400).send('Bucket name required to delete bucket');
	} else {
		fileStorage.deleteBucket(req.body.name).then((bucket) => {
			logger.log({
				description: 'Bucket deleted successfully.', bucket: bucket,
				func: 'deleteBucket', obj: 'AdminCtrls'
			});
			res.send(bucket);
		}, (err) => {
			logger.error({
				description: 'Error deleting bucket.', error: err,
				func: 'deleteBucket', obj: 'AdminCtrls'
			});
			res.status(500).send(err);
		});
	}
};
