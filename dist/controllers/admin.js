'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBuckets = getBuckets;
exports.deleteBucket = deleteBucket;

var _logger = require('../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _fileStorage = require('../utils/fileStorage');

var fileStorage = _interopRequireWildcard(_fileStorage);

var _application = require('../models/application');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function getBuckets(req, res, next) {
  //TODO: Limit/paginate number of buckets returned
  fileStorage.getBuckets().then(function (buckets) {
    _logger2.default.log({
      description: 'Buckets loaded.', buckets: buckets,
      func: 'getBuckets', obj: 'AdminCtrls'
    });
    res.send(buckets);
  }, function (err) {
    _logger2.default.error({
      description: 'Error getting buckets:',
      error: err, func: 'getBuckets', obj: 'AdminCtrls'
    });
    res.status(500).send('Error getting buckets.');
  });
} /**
   * @description Admin Controller
   */
;
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
function deleteBucket(req, res, next) {
  if (!_.has(req.body, 'name')) {
    res.status(400).send('Bucket name required to delete bucket');
  } else {
    fileStorage.deleteBucket(req.body.name).then(function (bucket) {
      _logger2.default.log({
        description: 'Bucket deleted successfully.', bucket: bucket,
        func: 'deleteBucket', obj: 'AdminCtrls'
      });
      res.send(bucket);
    }, function (err) {
      _logger2.default.error({
        description: 'Error deleting bucket.', error: err,
        func: 'deleteBucket', obj: 'AdminCtrls'
      });
      res.status(500).send(err);
    });
  }
};