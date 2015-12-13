import mongoose from 'mongoose';
import q from 'q';
import _ from 'lodash';
import formidable from 'formidable';
import util from 'util';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import db from './../utils/db';
import fileStorage from '../utils/fileStorage';
import * as sqs from './../utils/sqs';
import logger from './../utils/logger';

let templateBucket = "tessellate-templates";

let TemplateSchema = new mongoose.Schema(
	{
		name:{type:String, default:'', unique:true, index:true},
		author:{type: mongoose.Schema.Types.ObjectId, ref:'Account'},
		location:{
			storageType: {type: String},
			path: {type: String}
		},
		description:{type:String},
		tags:[{type:String}],
		frameworks:[{type:String}],
		createdAt: { type: Date, default: Date.now},
		updatedAt: { type: Date, default: Date.now}
	}
);

TemplateSchema.set('collection', 'templates');

TemplateSchema.methods = {
	uploadFiles:function(req){
		var bucketName,localDirectory;
		var d = q.defer();
		var self = this;
		//Create a new directory for template files
		var uploadDir = "fs/templates/" + this.name;
		//Accept files from form upload and save to disk
		var form = new formidable.IncomingForm(),
    files = [],
    fields = [];
    form.uploadDir = uploadDir
    form.keepExtensions = true;
		mkdirp(form.uploadDir, (err) => {
	    // path was created unless there was error
	    //Parse form
	    form.parse(req, (err) => {
	    	if(err){
	    		logger.log('error parsing form:', err);
	    		d.reject(err);
	    	}
	    	logger.log('Form parsed');
	    });
		});
    //TODO: Handle on error?
    form
	    .on('fileBegin', (name, file) => {
	    	var pathArray = file.path.split("/");
	    	var path = _.first(pathArray);
	    	path = path.join("/") + "/" + file.name;
	    	file.path = path;
			})
      .on('field', (field, value) => {
        // logger.log(field, value);
        //Handle form fields other than files
        fields.push([field, value]);
      })
      .on('file', (field, file) => {
        // logger.log(field, file);
        //Handle form files
        files.push([field, file]);
      })
      .on('end', () => {
        logger.log('-> upload done');
        logger.log('received files:\n\n '+util.inspect(files));
        // res.writeHead(200, {'content-type': 'text/plain'});
        // res.write('received fields:\n\n '+util.inspect(fields));
        // res.write('\n\n');
        // res.end('received files:\n\n '+util.inspect(files));
    		//TODO: Upload files from disk to S3
    		logger.log('upload localdir called with:', self.location);
				fileStorage.uploadLocalDir({bucket:self.location, localDir:uploadDir}).then(() => {
					//TODO: Remove files from disk
					logger.log('files upload successful:');
					rimraf(uploadDir, (err) => {
						if(!err){
							d.resolve();
						} else {
							logger.log('Error deleting folder after upload to template');
							d.reject(err);
						}
					});
				}, (err) => {
					d.reject(err);
				});
      });

    return d.promise;
	},
	createNew: function (req){
		var d = q.defer();
		var self = this;
		//TODO: Verify that name is allowed to be used for bucket
		return this.save().then(() => {
			if(req.files){
				this.uploadFiles(req).then(() => {
					logger.log('New template created and uploaded successfully');
					return;
				}, (err) => {
					logger.log('Error uploading files to new template:', err);
					return Promise.reject(err);
				});
			} else {
				return this;
			}
		}, (err) => {
			logger.log('Error creating new template:', err);
			return Promise.reject(err);
		});
		return d.promise;
	}
};

/*
 * Construct `User` model from `UserSchema`
 */
db.tessellate.model('Template', TemplateSchema);

/*
 * Make model accessible from controllers
 */
var Template = db.tessellate.model('Template');
Template.collectionName = TemplateSchema.get('collection');

exports.Template = db.tessellate.model('Template');
