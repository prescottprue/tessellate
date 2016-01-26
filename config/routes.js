'use strict';

/*!
 * Module dependencies.
 */

// Note: We can require users, projects and other cotrollers because we have
// set the NODE_PATH to be ./app/controllers (package.json # scripts # start)

const users = require('../app/controllers/users');
const user = require('../app/controllers/users');
const projects = require('../app/controllers/projects');
const comments = require('../app/controllers/comments');
const tags = require('../app/controllers/tags');
const auth = require('./middlewares/authorization');

/**
 * Route middlewares
 */

const userAuth = [auth.requiresLogin, auth.user.hasAuthorization];
const projectAuth = [auth.requiresLogin, auth.project.hasAuthorization];
const commentAuth = [auth.requiresLogin, auth.comment.hasAuthorization];

/**
 * Expose routes
 */

module.exports = function (app, passport) {

  // user routes
  app.get('/login', users.login);
  app.get('/signup', users.signup);
  app.get('/logout', users.logout);
  app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      console.log('final called', err, user, info);
      if(err || !user){
        return res.status(400).json(info);
      }
      res.json(info);
    })(req, res, next);
  });

  app.get('/auth/google',
    passport.authenticate('google', {
      failureRedirect: '/login',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    }), users.signin);
  app.get('/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login'
    }), users.authCallback);

  app.param('username', users.load);

  app.post('/users', users.create);
  app.get('/users', users.index);
  app.get('/users/:username', users.show);
  app.delete('/users', users.destroy);

  // project routes
  app.param('id', projects.load);
  app.get('/projects', projects.index);
  app.post('/projects', auth.requiresLogin, projects.create);
  app.get('/projects/:id', projects.show);
  app.get('/projects/:id/edit', projectAuth, projects.edit);
  app.put('/projects/:id', projectAuth, projects.update);
  app.delete('/projects/:id', projectAuth, projects.destroy);

  // home route
  app.get('/', projects.index);

  // comment routes
  app.param('commentId', comments.load);
  app.post('/projects/:id/comments', auth.requiresLogin, comments.create);
  app.get('/projects/:id/comments', auth.requiresLogin, comments.create);
  app.delete('/projects/:id/comments/:commentId', commentAuth, comments.destroy);

  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }

    console.error(err.stack);

    if (err.stack.includes('ValidationError')) {
      res.status(422).render('422', { error: err.stack });
      return;
    }

    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res) {
    res.status(404).json({message: 'Invalid request'});
  });
};
