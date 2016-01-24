import mongoose from 'mongoose';
import { first } from 'lodash';
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
		author:{type: mongoose.Schema.Types.ObjectId, ref:'User'},
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
	uploadFiles: function(req){
		let bucketName, localDirectory;
		let self = this;
		//Create a new directory for template files
		let uploadDir = "fs/templates/" + this.name;
		//Accept files from form upload and save to disk
		let form = new formidable.IncomingForm(),
    files = [],
    fields = [];
    form.uploadDir = uploadDir
    form.keepExtensions = true;
		return new Promise((resolve, reject) => {
			mkdirp(form.uploadDir, error => {
		    // path was created unless there was error
				if(error){
					logger.error({
						description: 'Error creating directory', error,
						func: 'uploadFiles', obj: 'Template'
					});
					return Promise.reject(error);
				}
		    //Parse form
		    form.parse(req, error => {
		    	if(error){
		    		logger.log({
							description: 'error parsing form:', error,
							func: 'uploadFiles', obj: 'Template'
						});
		    		Promise.reject(error);
		    	}
		    	logger.log({
						description: 'Form parsed',
						func: 'uploadFiles', obj: 'Template'
					});
		    });
			});
	    //TODO: Handle on error?
	    form.on('fileBegin', (name, file) => {
	    	let pathArray = file.path.split("/");
	    	let path = first(pathArray);
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
        logger.log({
					description: 'Received files ', files: util.inspect(files),
					func: 'uploadFiles', obj: 'Template'
				});
    		//TODO: Upload files from disk to S3
    		logger.log({
					description: 'Upload localdir called.', location: self.location,
					func: 'uploadFiles', obj: 'Template'
				});
				fileStorage.uploadLocalDir({bucket: self.location, localDir: uploadDir}).then(() => {
					//TODO: Remove files from disk
					logger.log({
						description: 'files upload successful.',
						func: 'uploadFiles', obj: 'Template'
					});
					rimraf(uploadDir, error => {
						if(error){
							logger.error({
								description: 'Error deleting folder after upload to template',
								func: 'uploadFiles', obj: 'Template'
							});
							reject(error);
						}
						resolve();
					});
				}, error => {
					logger.error({
						description: 'Error uploading local directory.',
						error, func: 'uploadFiles', obj: 'Template'
					});
					return Promise.reject(error);
				});
      });
		});
	},
	createNew: function (req) {
		//TODO: Verify that name is allowed to be used for bucket
		return this.save().then(() => {
			if(!req.files){
				return this;
			}
			return this.uploadFiles(req).then(() => {
				logger.log({
					description: 'New template created and uploaded successfully',
					func: 'createNew', 'obj': 'Template'
				});
				return;
			}, error => {
				logger.log({
					description: 'Error uploading files to new template:', error,
					func: 'createNew', 'obj': 'Template'
				});
				return Promise.reject(error);
			});
		}, error => {
			logger.log({
				description: 'Error creating new template:', error,
				func: 'createNew', 'obj': 'Template'
			});
			return Promise.reject(error);
		});
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
