'use strict';

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _formidable = require('formidable');

var _formidable2 = _interopRequireDefault(_formidable);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _db = require('./../utils/db');

var _db2 = _interopRequireDefault(_db);

var _fileStorage = require('../utils/fileStorage');

var _fileStorage2 = _interopRequireDefault(_fileStorage);

var _sqs = require('./../utils/sqs');

var sqs = _interopRequireWildcard(_sqs);

var _logger = require('./../utils/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var templateBucket = "tessellate-templates";

var TemplateSchema = new _mongoose2.default.Schema({
	name: { type: String, default: '', unique: true, index: true },
	author: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'User' },
	location: {
		storageType: { type: String },
		path: { type: String }
	},
	description: { type: String },
	tags: [{ type: String }],
	frameworks: [{ type: String }],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

TemplateSchema.set('collection', 'templates');

TemplateSchema.methods = {
	uploadFiles: function uploadFiles(req) {
		var bucketName, localDirectory;
		var d = _q2.default.defer();
		var self = this;
		//Create a new directory for template files
		var uploadDir = "fs/templates/" + this.name;
		//Accept files from form upload and save to disk
		var form = new _formidable2.default.IncomingForm(),
		    files = [],
		    fields = [];
		form.uploadDir = uploadDir;
		form.keepExtensions = true;
		(0, _mkdirp2.default)(form.uploadDir, function (err) {
			// path was created unless there was error
			//Parse form
			form.parse(req, function (err) {
				if (err) {
					_logger2.default.log('error parsing form:', err);
					d.reject(err);
				}
				_logger2.default.log('Form parsed');
			});
		});
		//TODO: Handle on error?
		form.on('fileBegin', function (name, file) {
			var pathArray = file.path.split("/");
			var path = _lodash2.default.first(pathArray);
			path = path.join("/") + "/" + file.name;
			file.path = path;
		}).on('field', function (field, value) {
			// logger.log(field, value);
			//Handle form fields other than files
			fields.push([field, value]);
		}).on('file', function (field, file) {
			// logger.log(field, file);
			//Handle form files
			files.push([field, file]);
		}).on('end', function () {
			_logger2.default.log('-> upload done');
			_logger2.default.log('received files:\n\n ' + _util2.default.inspect(files));
			// res.writeHead(200, {'content-type': 'text/plain'});
			// res.write('received fields:\n\n '+util.inspect(fields));
			// res.write('\n\n');
			// res.end('received files:\n\n '+util.inspect(files));
			//TODO: Upload files from disk to S3
			_logger2.default.log('upload localdir called with:', self.location);
			_fileStorage2.default.uploadLocalDir({ bucket: self.location, localDir: uploadDir }).then(function () {
				//TODO: Remove files from disk
				_logger2.default.log('files upload successful:');
				(0, _rimraf2.default)(uploadDir, function (err) {
					if (!err) {
						d.resolve();
					} else {
						_logger2.default.log('Error deleting folder after upload to template');
						d.reject(err);
					}
				});
			}, function (err) {
				d.reject(err);
			});
		});

		return d.promise;
	},
	createNew: function createNew(req) {
		var _this = this;

		var d = _q2.default.defer();
		var self = this;
		//TODO: Verify that name is allowed to be used for bucket
		return this.save().then(function () {
			if (req.files) {
				_this.uploadFiles(req).then(function () {
					_logger2.default.log('New template created and uploaded successfully');
					return;
				}, function (err) {
					_logger2.default.log('Error uploading files to new template:', err);
					return Promise.reject(err);
				});
			} else {
				return _this;
			}
		}, function (err) {
			_logger2.default.log('Error creating new template:', err);
			return Promise.reject(err);
		});
		return d.promise;
	}
};

/*
 * Construct `User` model from `UserSchema`
 */
_db2.default.tessellate.model('Template', TemplateSchema);

/*
 * Make model accessible from controllers
 */
var Template = _db2.default.tessellate.model('Template');
Template.collectionName = TemplateSchema.get('collection');

exports.Template = _db2.default.tessellate.model('Template');