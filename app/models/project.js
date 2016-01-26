'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const notify = require('../mailer');

// const Imager = require('imager');
// const config = require('../../config/config');
// const imagerConfig = require(config.root + '/config/imager.js');

const Schema = mongoose.Schema;

const getTags = tags => tags.join(',');
const setTags = tags => tags.split(',');

/**
 * Project Schema
 */

const ProjectSchema = new Schema({
  name: { type : String, default : '', trim : true },
  owner: { type : Schema.ObjectId, ref : 'User' },
  tags: { type: [], get: getTags, set: setTags },
  createdAt  : { type : Date, default : Date.now }
});

/**
 * Validations
 */

ProjectSchema.path('name').required(true, 'Project name cannot be blank');

/**
 * Pre-save hook
 */

// ProjectSchema.pre('save', function (next) {
//   if (!this.isNew) return next(new Error('Project is not new.'));
//   next()
// });


/**
 * Pre-remove hook
 */

ProjectSchema.pre('remove', function (next) {
  // const imager = new Imager(imagerConfig, 'S3');
  // const files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  // imager.remove(files, function (err) {
  //   if (err) return next(err);
  // }, 'project');

  next();
});

/**
 * Methods
 */

ProjectSchema.methods = {

  /**
   * Save project and upload image
   *
   * @param {Object} images
   * @api private
   */

  uploadAndSave: function (images) {
    const err = this.validateSync();
    if (err && err.toString()) throw new Error(err.toString());
    // this.load({owner: this.username, })
    return this.save();

    /*
    if (images && !images.length) return this.save();
    const imager = new Imager(imagerConfig, 'S3');

    imager.upload(images, function (err, cdnUri, files) {
      if (err) return cb(err);
      if (files.length) {
        self.image = { cdnUri : cdnUri, files : files };
      }
      self.save(cb);
    }, 'project');
    */
  },

  /**
   * Add comment
   *
   * @param {User} user
   * @param {Object} comment
   * @api private
   */

  addCollaborator: function (user, comment) {
    this.collaborators.push(user._id);

    if (!this.user.email) this.user.email = 'email@product.com';

    return this.save();
  },

  /**
   * Remove comment
   *
   * @param {commentId} String
   * @api private
   */

  removeComment: function (commentId) {
    const index = this.comments
      .map(comment => comment.id)
      .indexOf(commentId);

    if (~index) this.comments.splice(index, 1);
    else throw new Error('Comment not found');
    return this.save();
  }
};

/**
 * Statics
 */

ProjectSchema.statics = {

  /**
   * Find project by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (find) {
    return this.findOne(find)
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec();
  },

  /**
   * List projects
   *
   * @param {Object} options
   * @api private
   */

  list: function (options) {
    const criteria = options.criteria || {};
    const page = options.page || 0;
    const limit = options.limit || 30;
    return this.find(criteria)
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Project', ProjectSchema);
