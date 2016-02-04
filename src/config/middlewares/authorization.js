'use strict';

/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  if (req.method == 'GET') req.session.returnTo = req.originalUrl;
  res.redirect('/login');
};

/*
 *  User authorization routing middleware
 */

exports.user = {
  hasAuthorization: function (req, res, next) {
    if (req.profile.id != req.user.id) {
      req.flash('info', 'You are not authorized');
      return res.redirect('/users/' + req.profile.id);
    }
    next();
  }
};

/*
 *  Project authorization routing middleware
 */

exports.project = {
  hasAuthorization: function (req, res, next) {
    //TODO: Check if user is administrator
    if (req.project.owner != req.user._id) {
      console.log('user', req.user);
      console.log('project', req.project);
      return res.json({
        message: 'Not Authorized'
      });
    }
    next();
  }
};

/**
 * Comment authorization routing middleware
 */

exports.comment = {
  hasAuthorization: function (req, res, next) {
    // if the current user is comment owner or project owner
    // give them authority to delete
    if (req.user.id === req.comment.user.id || req.user.id === req.project.user.id) {
      next();
    } else {
      req.flash('info', 'You are not authorized');
      res.redirect('/projects/' + req.project.id);
    }
  }
};
