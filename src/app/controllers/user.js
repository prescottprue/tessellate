'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const wrap = require('co-express');
const only = require('only');
const User = mongoose.model('User');
const Project = mongoose.model('Project');
import OAuth from 'oauthio';
/**
 * Return logged in user
 */

exports.index = wrap(function* (req, res) {
  const user = yield User.load({ _id: req.user._id });
  if (!user) return res.status(404).json({message: 'User not found'});
  res.json(user);
});

exports.getStateToken = function(req, res) {
  OAuth.initialize('sxwuB9Gci8-4pBH7xjD0V_jooNU', 'H3mAP5uBspePZLft6-vimBp3Ox8');
  var token = OAuth.generateStateToken(req);
  console.log('token generated');
  res.json({ token });
};
exports.auth = wrap(function* (req, res) {
  console.log("auth called with", req.body, req.session);
  try {
    OAuth.auth(req.body.code, req).then((response) => {
      console.log('authenticated: ', response);
      res.json({response});
    }).fail((error) => {
      console.log('error auth oauth:', error.toString());
    })
  } catch(err) {
    console.error('error authenticating with oAuth', err);
  }

});

/**
 * Return projects for logged in user
 */

exports.projects = wrap(function* (req, res) {
  const projects = yield Project.list({ owner: req.user._id });
  res.json(projects);
});

/**
 * Login
 */

exports.login = wrap(function* (req, res) {
  var googleUser;
  if(req.body.provider === 'google'){
    console.log('loading google user:', req.body);
    googleUser = yield User.load({ email: req.body.email });
    console.log('google user loaded', googleUser);
  }

  // if(!req.user) res.status(400).json({message: 'Error with login.'});

  const user = googleUser || req.user;
  const token = user.createAuthToken();
  res.json({ token, user: only(user, '_id username email name') });
});

/**
 * Return logged in user
 */

exports.logout = wrap(function* (req, res) {
  // console.log('logout request:', req.user);
  // const user = yield User.load({ owner: req.user._id  });
  // delete user.authToken;
  // yield user.save();
  res.json({
    message: 'Logout successful.'
  });
});

/**
 * Session
 */
exports.avatar = wrap(function* (req, res) {
  //Handle an image
  const image = req.file
    ? req.file
    : undefined;
  console.log('image from req:', image);
  try {
    const user = req.profile;
    yield user.uploadImageAndSave(image);
    res.json({message: 'Image uploaded successfully.'});
  } catch(error) {
    res.status(400).json({message: 'Error uploading image.', error: error.toString()});
  }
});
