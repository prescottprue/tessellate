'use strict';

/**
 * Module dependencies.
 */

var Notifier = require('notifier');
var swig = require('swig');
var config = require('../../config/config');

/**
 * Process the templates using swig - refer to notifier#processTemplate method
 *
 * @param {String} tplPath
 * @param {Object} locals
 * @return {String}
 * @api public
 */

Notifier.prototype.processTemplate = function (tplPath, locals) {
  locals.filename = tplPath;
  return swig.renderFile(tplPath, locals);
};

/**
 * Expose
 */

module.exports = {

  /**
   * Comment notification
   *
   * @param {Object} options
   * @param {Function} cb
   * @api public
   */

  comment: function comment(options, cb) {
    var project = options.project;
    var author = project.user;
    var user = options.currentUser;
    var notifier = new Notifier(config.notifier);

    var obj = {
      to: author.email,
      from: 'your@product.com',
      subject: user.name + ' added a comment on your project ' + project.title,
      alert: user.name + ' says: "' + options.comment,
      locals: {
        to: author.name,
        from: user.name,
        body: options.comment,
        project: project.name
      }
    };

    // for apple push notifications
    /*notifier.use({
      APN: true
      parseChannels: ['USER_' + author._id.toString()]
    })*/

    try {
      notifier.send('comment', obj, cb);
    } catch (err) {
      console.log(err);
    }
  }
};