'use strict';

/*!
 * Module dependencies.
 */

// Note: We can require users, projects and other cotrollers because we have
// set the NODE_PATH to be ./app/controllers (package.json # scripts # start)

const users = require('../app/controllers/users');
const userCtrl = require('../app/controllers/user');
const projects = require('../app/controllers/projects');
const home = require('../app/controllers/home');
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
  //Ui Auth
  // app.get('/login', users.login); //Login page
  // app.get('/signup', users.signup); //Signup page
  // app.get('/logout', users.logout); //Logout Page
  // app.get('/auth/google',
  //   passport.authenticate('google', {
  //     failureRedirect: '/login',
  //     scope: [
  //       'https://www.googleapis.com/auth/userinfo.profile',
  //       'https://www.googleapis.com/auth/userinfo.email'
  //     ]
  //   }), users.signin);
  // app.get('/auth/google/callback',
  //   passport.authenticate('google', {
  //     failureRedirect: '/login'
  //   }), users.authCallback);

  // Auth
  app.post('/signup', users.create);
  app.post('/login', loginReq);
  app.put('/login', loginReq);
  app.put('/logout', userCtrl.logout);
  app.put('/auth/google', function(req, res, next) {
    passport.authenticate('google', function (err, user, info) {
      if(err || !user){
        return res.status(400).json(info || err);
      }
      //TODO: Map this to a controller function
      res.json(user);
    })(req, res, next);
  });
  //User routes
  app.get('/user', userCtrl.index);
  app.get('/user/projects', userCtrl.projects);
  // app.post('/user/projects', userCtrl.createProject);
  app.get('/users/search', users.search);

  //Users routes
  app.param('username', users.load);
  app.get('/users', users.index);
  app.get('/users/:username', users.show);
  app.delete('/users/:username', users.destroy);

  app.param('owner', users.load);
  app.param('projectName', projects.load);
  app.param('collaborator', users.loadCollaborator);

  // projects routes
  app.get('/projects', projects.index);
  app.get('/projects/:owner/:projectName', projects.get);
  app.get('/projects/:owner/:projectName/edit', projects.edit);
  app.put('/projects/:owner/:projectName', projects.update);
  app.delete('/projects/:owner/:projectName', projects.destroy);
  app.get('/projects/:owner/:projectName/collaborators', projects.getCollaborators);
  app.put('/projects/:owner/:projectName/collaborators/:collaborator', projects.addCollaborator);
  app.delete('/projects/:owner/:projectName/collaborators/:collaborator', projects.removeCollaborator);

  // users routes
  app.get('/users/:owner/projects', projects.index);
  app.post('/users/:owner/projects', projects.create);
  app.get('/users/:owner/projects/:projectName', projects.get);
  app.put('/users/:owner/projects/:projectName', projects.update);
  app.get('/users/:owner/projects/:projectName/collaborators', projects.getCollaborators);
  app.put('/users/:owner/projects/:projectName/collaborators/:collaborator', projects.addCollaborator);
  app.delete('/users/:owner/projects/:projectName/collaborators/:collaborator', projects.removeCollaborator);
  app.delete('/users/:owner/projects/:projectName', projects.destroy);

  // home route
  app.get('/', home.index);

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
    // res.status(500).render('500', { error: err.stack });

    // 500 Response
    res.status(500).json({
      message: 'Error.',
      stack: err.stack,
      code: 500
    });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res) {
    res.status(404).json({
      message: 'Invalid request.',
      status: 'NOT_FOUND',
      code: 404
    });
  });

  function loginReq(req, res, next) {
    if(req.body.provider === 'google'){
      userCtrl.login(req, res, next);
    } else {
      passport.authenticate('local', function (error, user, info) {
        if(error || !user){
          console.log({ message: 'Error with login request.', error });
          return res.status(400).json(info || err);
        }
        req.user = user;
        userCtrl.login(req, res, next);
      })(req, res, next);
    }
  }
};
