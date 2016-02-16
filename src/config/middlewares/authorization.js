'use strict';

/*
 *  Generic require login routing middleware
 */

export function requiresLogin(req, res, next) {
  if (req.isAuthenticated()) return next();
  if (req.method == 'GET') req.session.returnTo = req.originalUrl;
  console.log('request:', req.user);
  // res.json({message: 'Authentication is required.'});
  next();
};


/*
 *  User authorization routing middleware
 */

const user = {
  hasAuthorization: (req, res, next) => {
    if (!req.user || req.profile._id != req.user._id) {
      return res.json({ message: 'Not authorized'});
    }
    next();
  }
};

/*
 *  Project authorization routing middleware
 */
const project = {
  hasAuthorization: (req, res, next) => {
    //TODO: Check if user is administrator
    console.log('has authorization check:', req.profile, req.user);
    if (req.project.owner != req.profile._id) {
      console.log('user', req.user);
      console.log('project', req.project);
      return res.json({
        message: 'Not Authorized'
      });
    }
    next();
  }
};

export { user, project };
