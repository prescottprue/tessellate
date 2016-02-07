'use strict';

/**
 * Module dependencies.
 */

import mongoose from 'mongoose';
import wrap from 'co-express';
import only from 'only';
import OAuth from 'oauthio';

const User = mongoose.model('User');
const Project = mongoose.model('Project');

/**
 * Return logged in user
 */
exports.index = wrap(function* (req, res) {
  const user = yield User.load({ _id: req.user._id });
  if (!user) return res.status(404).json({message: 'User not found'});
  res.json(user);
});

/**
 * Get state token
 */
exports.getStateToken = function(req, res) {
  OAuth.initialize('sxwuB9Gci8-4pBH7xjD0V_jooNU', 'H3mAP5uBspePZLft6-vimBp3Ox8');
  var token = OAuth.generateStateToken(req.session);
  console.log('token generated', token, typeof token);
  console.log('session', req.session);
  res.json({ token });
};


exports.providerAuth = wrap(function* (req, res) {
  const { stateToken, provider, code } = req.body;
  req.session.csrf_tokens = [ stateToken ];
  try {
    const auth = yield OAuth.auth(provider, req.session, { code });
    const providerAccount = yield auth.me();
    const { email, name, avatar } = providerAccount;
    try {
      //Log into already existing user
      const existingUser = yield User.load({ criteria: { email } });
      const existingToken = existingUser.createAuthToken();
      if(existingUser) return res.json({ user: existingUser, token: existingToken });
    } catch(err) {
      //User already exists
      let newData = { email, name, provider, avatar_url: avatar, username: providerAccount.alias || email.split('@')[0] };
      newData[req.body.provider] = providerAccount;
      try {
        const user = new User(newData);
        yield user.save();
        const token = user.createAuthToken();
        res.json({ token, user });
      } catch(error) {
        res.status(400).json({message: 'Error creating new user.', error: error.toString()});
      }
    }
  } catch(err) {
    console.error('error authenticating with oAuth', err.toString());
    res.status(400).json({message: 'error authenticating', error: err.toString()});
  }
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
 * Return projects for logged in user
 */

exports.projects = wrap(function* (req, res) {
  const projects = yield Project.list({ owner: req.user._id });
  res.json(projects);
});

/**
 * Avatar
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
