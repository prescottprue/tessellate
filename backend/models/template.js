var db = require('./../lib/db');
var mongoose = require('mongoose');
var fileStorage = require('../lib/fileStorage');
var q = require('q');
var _ = require('underscore');
var sqs = require('./../lib/sqs');
var templateBucket = "hypercube-templates";
var formidable = require('formidable');
var util = require('util');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var TemplateSchema = new mongoose.Schema({
	name:{type:String, default:'', unique:true, index:true},
	author:{type: mongoose.Schema.Types.ObjectId, ref:'User'},
	location:{type:String},
	description:{type:String},
	tags:[{type:String}],
	frameworks:[{type:String}],
	createdAt: { type: Date, default: Date.now},
	updatedAt: { type: Date, default: Date.now}
});

TemplateSchema.set('collection', 'templates');

TemplateSchema.methods = {
	saveNew: function(){
		var d = q.defer();
		if(!this.location){
			//Build location off of safe version of name
			//TODO: Make this the safe version of name
			this.location = templateBucket + '/' + this.name;
		}
		this.save(function (err, newTemplate) {
			if (err) { 
				console.error('[Template.saveNew()] Error saving Template:', err);
				return d.reject(err); 
			}
			if (!newTemplate) {
				console.error('[Template.saveNew()] Template could not be saved');
				return d.reject(Error('Template could not be saved.'));
			}
			d.resolve(newTemplate);
		});
		return d.promise;
	},
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

		mkdirp(form.uploadDir, function(err) { 
	    // path was created unless there was error
	    //Parse form
	    form.parse(req, function(err){
	    	if(err){
	    		console.log('error parsing form:', err);
	    		d.reject(err);
	    	}
	    	console.log('Form parsed')
	    });
		});
    //TODO: Handle on error?
    form
	    .on('fileBegin', function(name, file) {
	    	var pathArray = file.path.split("/");
	    	var path = _.initial(pathArray);
	    	path = path.join("/") + "/" + file.name;
	    	file.path = path;
			})
      .on('field', function(field, value) {
        // console.log(field, value);
        //Handle form fields other than files
        fields.push([field, value]);
      })
      .on('file', function(field, file) {
        // console.log(field, file);
        //Handle form files
        files.push([field, file]);
      })
      .on('end', function() {
        console.log('-> upload done');
        console.log('received files:\n\n '+util.inspect(files));
        // res.writeHead(200, {'content-type': 'text/plain'});
        // res.write('received fields:\n\n '+util.inspect(fields));
        // res.write('\n\n');
        // res.end('received files:\n\n '+util.inspect(files));
    		//TODO: Upload files from disk to S3
    		console.log('upload localdir called with:', self.location);
				fileStorage.uploadLocalDir({bucket:self.location, localDir:uploadDir}).then(function (){
					//TODO: Remove files from disk
					console.log('files upload successful:');
					rimraf(uploadDir, function (err){
						if(!err){
							d.resolve();
						} else {
							console.log('Error deleting folder after upload to template');
							d.reject(err);
						}
					});
				}, function (err){
					d.reject(err);
				});
      });

    return d.promise;
	},
	createNew: function(req){
		var d = q.defer();
		var self = this;
		//TODO: Verify that name is allowed to be used for bucket
		this.saveNew().then(function (){
			if(req.files){
				self.uploadFiles(req).then(function (){
					console.log('New template created and uploaded successfully');
					d.resolve();
				}, function (err){
					console.log('Error uploading files to new template:', err);
					d.reject(err);
				});
			} else {
				d.resolve(self);
			}
		}, function (err){
			console.log('Error creating new template:', err);
			d.reject(err);
		});
		return d.promise;
	}
};

/*
 * Construct `User` model from `UserSchema`
 */
db.hypercube.model('Template', TemplateSchema);

/*
 * Make model accessible from controllers
 */
var Template = db.hypercube.model('Template');
Template.collectionName = TemplateSchema.get('collection');

exports.Template = db.hypercube.model('Template');
