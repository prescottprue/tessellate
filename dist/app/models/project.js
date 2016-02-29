'use strict';

/**
 * Module dependencies.
 */

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _mailer = require('../mailer');

var _mailer2 = _interopRequireDefault(_mailer);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

/**
 * Project Schema
 */

var ProjectSchema = new Schema({
  name: { type: String, default: '', trim: true },
  owner: { type: Schema.ObjectId, ref: 'User' },
  private: { type: Boolean, default: false },
  collaborators: [{ type: Schema.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

/**
 * Validations
 */
ProjectSchema.path('owner').required(true, 'Project owner cannot be blank');

ProjectSchema.path('name').required(true, 'Project name cannot be blank');

ProjectSchema.path('name').validate(function (name, fn) {
  var Project = _mongoose2.default.model('Project');
  // Check only when it is a new project or when name field is modified
  if (this.isNew || this.isModified('name')) {
    //Check that owner does not already have a project with the same name
    Project.find({ name: name, owner: this.owner }).exec(function (err, projects) {
      fn(!err && projects.length === 0);
    });
  } else fn(true);
}, 'Owner already has a project with that name.');

/**
 * Pre-remove hook
 */

// ProjectSchema.pre('remove', (next) => {
//   next();
// });

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

  addCollaborator: function addCollaborator(user) {
    if (this.collaborators && (0, _lodash.find)(this.collaborators, { _id: user._id })) {
      throw new Error('Collaborator already exists');
    }
    this.collaborators.push(user);
    return this.save();
  },

  /**
   * Remove collaborator
   *
   * @param {String} userId - Id of user to remove from collaborators
   * @api private
   */

  removeCollaborator: function removeCollaborator(userId) {
    var index = this.collaborators.map(function (user) {
      return JSON.stringify(user._id);
    }).indexOf(JSON.stringify(userId));
    if (~index) this.collaborators.splice(index, 1);else throw new Error('Collaborator not found');
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

  load: function load(find) {
    return this.findOne(find).populate('owner', 'name email username avatar_url').populate('collaborators', 'name email username avatar_url').exec();
  },

  /**
   * List projects
   *
   * @param {Object} options
   * @api private
   */

  list: function list(options) {
    var criteria = options.criteria || {};
    var page = options.page || 0;
    var limit = options.limit || 30;
    return this.find(criteria).populate('collaborators', 'name username email avatar_url').populate('owner', 'name username email avatar_url').sort({ createdAt: -1 }).limit(limit).skip(limit * page).exec();
  }
};

_mongoose2.default.model('Project', ProjectSchema);