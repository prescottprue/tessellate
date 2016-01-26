'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const notify = require('../mailer');

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
 * Pre-remove hook
 */

ProjectSchema.pre('remove', function (next) {
  next();
});

/**
 * Methods
 */

ProjectSchema.methods = {

  /**
   * Add collaborator
   *
   * @param {Object|String} user - User object of user to add as collaborator
   * @api private
   */

  addCollaborator: function (user) {
    this.collaborators.push(user._id);

    if (!this.user.email) this.user.email = 'email@product.com';

    return this.save();
  },

  /**
   * Remove collaborator
   *
   * @param {String} userId - Id of user to remove from collaborators
   * @api private
   */

  removeCollaborator: function (userId) {
    const index = this.collaborators
      .map(user => user.id)
      .indexOf(userId);

    if (~index) this.comments.splice(index, 1);
    else throw new Error('Collaborator not found');
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
      .populate('owner', 'name email username')
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
      .populate('owner', 'name username email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Project', ProjectSchema);
