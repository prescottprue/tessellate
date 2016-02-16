'use strict';

/**
 * Module dependencies.
 */

import express from 'express';
import session from 'express-session';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
// import csrf from 'csurf';
import multer from 'multer';
import swig from 'swig';
import jwt from 'express-jwt';
import { find } from 'lodash';
import flash from 'connect-flash';
import winston from 'winston';
import helpers from 'view-helpers';
import config from './config';
import pkg from '../../package.json';

const mongoStore = require('connect-mongo')(session);
const env = process.env.NODE_ENV || 'development';

/**
 * Expose
 */

module.exports = function (app, passport) {

  // Compression middleware (should be placed before express.static)
  app.use(compression({
    threshold: 512
  }));

  // Static files middleware
  app.use(express.static(config.root + '/public'));

  // Use winston on production
  let log = 'dev';
  if (env !== 'development') {
    log = {
      stream: {
        write: message => winston.info(message)
      }
    };
  }

  // Don't log during tests
  // Logging middleware
  if (env !== 'test') app.use(morgan(log));

  // Swig templating engine settings
  if (env === 'development' || env === 'test') {
    console.log('')
    swig.setDefaults({
      cache: false
    });
  }

  // set views path, template engine and default layout
  app.engine('html', swig.renderFile);
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'html');

  // expose package.json to views
  app.use((req, res, next) => {
    res.locals.pkg = pkg;
    res.locals.env = env;
    next();
  });

  // bodyParser should be above methodOverride
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer({dest: './uploads/'}).single('image'));
  app.use(methodOverride(req => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  // CookieParser should be above session
  app.use(cookieParser());
  app.use(cookieSession({ secret: 'secret' }));
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: pkg.name,
    store: new mongoStore({
      url: config.db,
      collection : 'sessions'
    })
  }));

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // connect flash for flash messages - should be declared after sessions
  app.use(flash());

  // should be declared after session and flash
  app.use(helpers(pkg.name));

  app.use(cors());


  /** Authentication
   * @description Enable authentication based on config setting
   */
  const { enabled, secret, ignoredPaths } = config.auth;

  if(enabled){
    /** Route Protection
     * @description Get token from Authorization header
     */
    app.use(jwt({ secret, credentialsRequired: false, getToken: fromHeaderOrCookie }).unless({ path: ignoredPaths }));

    function fromHeaderOrCookie(req) {
      console.log('auth req headers:', req.headers);
      if(req.headers.authorization){
        return req.headers.authorization.split(' ')[1];
      }
      if(req.headers.cookie){
        console.log('there are cookies');
        const cookiesList = req.headers.cookie.split(';');
        const matchingCookie = find(cookiesList, cookie => {
          return cookie.split('=')[0] === config.auth.cookieName
        });
        console.log('matching cookie:', matchingCookie.split('=')[1].replace(';', ''));
        if(matchingCookie) return matchingCookie.split('=')[1].replace(';', '');
      }
      return null;
    }

    /** Unauthorized Error Handler
     * @description Respond with 401 when authorization token is invalid
     */
    app.use((err, req, res, next) => {
      if (err.name === 'UnauthorizedError') {
        console.error({
          description: 'Error confirming token.',
          error: err, obj: 'server'
        });
        return res.status(401).json({message:'Invalid token', code:'UNAUTHORIZED'});
      }
    });
  } else {
    console.log({
      description: 'Authentication is disabled. Endpoint results may be affected.',
      obj: 'server'
    });
  }

  app.use((err, req, res, next) => {
    console.error('Error:');
    console.error(err.stack);
    console.error(err.toString());
  })
  // Cross Site Request Forgery
  // if (env !== 'test') {
  //   app.use(csrf());
  //
  //   // This could be moved to view-helpers :-)
  //   app.use(function (req, res, next) {
  //     res.locals.csrf_token = req.csrfToken();
  //     next();
  //   });
  // }
};
