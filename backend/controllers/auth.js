/**
 * @description Authentication controller
 */
import mongoose from 'mongoose';
import url from 'url';
import { has, isString } from 'lodash';
import logger from '../utils/logger';
import { User } from '../models/user';
import { Session } from '../models/session';
import jwt from 'jsonwebtoken';
import config from '../config/default';
/**
 * @api {post} /signup Sign Up
 * @apiDescription Sign up a new user and start a session as that new user
 * @apiName Signup
 * @apiGroup Auth
 *
 * @apiParam {Number} id Users unique ID.
 * @apiParam {String} username Username of user to signup as.
 * @apiParam {String} [title] Title of user to signup as.
 * @apiParam {String} email Email of user to signup as.
 * @apiParam {String} password Password of user to signup as.
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       user: {
 *         "name": "John Doe",
 *         "username": "someguy1",
 *     	   "email": "test@test.com",
 *       },
 *       token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InNjb3R0NSIsImdyb3VwcyI6W10sInNlc3Npb25JZCI6IjU2YTVhYTkxMWMxNjljYTgwZTQyOWE5ZSIsInVzZXJJZCI6IjU2YTVhYTkxMWMxNjljYTgwZTQyOWE5ZCIsImlhdCI6MTQ1MzY5NzY4MX0.USXvRAjcHj44amw_NqjcnVUMGQMB6R3efWpvC6HtCyY"
 *     }
 *
 */
export function signup(req, res, next) {
	logger.debug({
		description: 'Signup request.', func: 'signup', obj: 'AuthCtrls'
	});
	const { username, email, name } = req.body;
	//Check for username or email
	if(!username || !email){
		return res.status(400).json({
			code: 400,
			message: 'Username and Email are required to signup'
		});
	}
	let user = new User({ username, email, name });
	// TODO: Start a session with new user
	user.signup(req.body).then(newUser => {
		logger.debug({
			description: 'New user created successfully.', newUser,
			func: 'signup', obj: 'AuthCtrls'
		});
		res.send(newUser);
	}, error => {
		logger.error({
			description: 'Error signing up.', error,
			func: 'signup', obj: 'AuthCtrls'
		});
		res.status(500).json(error);
	});
};

/**
 * @api {post} /login Login
 * @apiDescription Login and start a new session.
 * @apiName Login
 * @apiGroup Auth
 *
 * @apiParam {String} username - Username of user to login as. Email must be provided if username is not.
 * @apiParam {String} email - Email of user to login as. Can be used instead of username.
 * @apiParam {String} password - Users password
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       user:{
 *         name: "John Doe",
 *         username:"hackerguy1",
 *         title: "Front End Developer",
 *         role:"admin",
 *         createdAt:1438737438578
 *         updatedAt:1438737438578
 *       },
 *       token:'99qaisnuufa9suf9ue0hf2h'
 *     }
 *
 */
export function login(req, res, next) {
	const { username, email, password, provider } = req.body;
	if((!username && !email) || (!password && !provider)){
		return res.status(400).json({
			message: 'Username/Email and password or provider info required to login'
		});
	}
	let findObj = {};
	if(username && isString(username)){
		findObj = username.indexOf('@') !== -1 ? { email: username } : { username };
	}
	if(email && isString(email)){
		findObj.email = email;
	}
	logger.debug({
		description: 'Searching for user to login as.', findObj,
		func: 'login', obj: 'AuthCtrl'
	});
	User.findOne(findObj)
	.populate({path:'groups', select:'name'})
	.select({__v: 0, createdAt: 0, updatedAt: 0})
	.then(currentUser => {
		if(!currentUser){
			logger.error({
				description: 'User not found.',
				func: 'login', obj: 'AuthCtrl'
			});
			return res.status(409).json({message: 'User not found.'});
		}
		currentUser.login(password).then(loginRes => {
			logger.log({
				description: 'Login Successful.',
				func: 'login', obj: 'AuthCtrl'
			});
			res.json(loginRes);
		}, error => {
			//TODO: Handle wrong password
			logger.error({
				description: 'Login Error.', error,
				func: 'login', obj: 'AuthCtrl'
			});
			res.status(400).json({message: 'Error logging in.'});
		});
	}, error => {
		logger.error({
			description: 'Login error', error,
			func: 'login', obj: 'AuthCtrl'
		});
		res.status(500).json({message: 'Error logging in.'});
	});
};

/**
 * @api {post} /logout Logout
 * @apiDescription Logout the currently logged in user and invalidate  token.
 * @apiName Logout
 * @apiGroup Auth
 *
 * @apiSuccess {Object} userData Object containing success message
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Logout successful"
 *     }
 *
 */
export function logout(req, res, next) {
	//TODO: Invalidate token
	logger.debug({
		description: 'Logout called.',
		func: 'logout', obj: 'AuthCtrl'
	});
	//TODO: Handle user not being in req.user
	const user = new User(req.user);
	user.endSession().then(() => {
		logger.info({
			description: 'Successfully ended session',
			func: 'logout', obj: 'AuthCtrl'
		});
		res.json({message: 'Logout successful.'});
	}, error => {
		logger.error({
			description: 'Error ending session.', error,
			func: 'logout', obj: 'AuthCtrl'
		});
		res.status(500).json({message: 'Error ending session.'});
	});
};

/**
 * @api {put} /user Verify
 * @apiDescription Verify token and get matching user's data.
 * @apiName Verify
 * @apiGroup Auth
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "John Doe",
 *       username:"hackerguy1",
 *       title: "Front End Developer",
 *       role:"admin",
 *       createdAt:1438737438578
 *       updatedAt:1438737438578
 *     }
 *
 */
export function verify(req, res, next) {
	//TODO:Actually verify user instead of just returning user data
	// logger.log('verify request:', req.user);
	if(!req.user){
		logger.error({
			description: 'Invalid auth token.',
			func: 'verify', obj: 'AuthCtrl'
		});
		res.status(401).send('Valid Auth token required to verify');
	}
	//Find by username in token
	let findObj = {};
	if(has(req.user, "username")){
		findObj.username = req.user.username;
	} else {
		findObj.email = req.user.email;
	}
	let query = User.findOne(findObj).select({password: 0, __v: 0, createdAt: 0, updatedAt: 0});
	query.then((result) => {
		if(!result){ //Matching user already exists
			// TODO: Respond with a specific error code
			logger.error({
				description: 'User not found.',
				error: err, func: 'verify', obj: 'AuthCtrl'
			});
			return res.status(400).send('User with this information does not exist.');
		}
		res.json(result);
	}, err => {
		logger.error({
			description: 'Error querying for user',
			error: err, func: 'verify', obj: 'AuthCtrl'
		});
		return res.status(500).send('Unable to verify token.');
	});
};
/**
 * @api {post} /recover Recover
 * @apiDescription Recover an user though email
 * @apiName Recover
 * @apiGroup Auth
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       name: "John Doe",
 *       username:"hackerguy1",
 *       title: "Front End Developer",
 *       role:"admin",
 *       createdAt:1438737438578
 *       updatedAt:1438737438578
 *     }
 *
 */
export function recover(req, res, next) {
	logger.debug({
		description: 'Recover request recieved.',
		func: 'recover', obj: 'AuthCtrl'
	});
	if(!req.body || (!req.body.username && !req.body.email)){
		logger.error({
			description: 'Username or email required to recover user.',
			func: 'recover', obj: 'AuthCtrl'
		});
		res.send('Username or email required to recover user.');
	}
	let findObj = {};
	if(has(req.body, "username")){
		findObj.username = req.body.username;
	} else {
		findObj.email = req.body.email;
	}
	logger.log({
		description: 'Find object built.', findObj,
		func: 'recover', obj: 'AuthCtrl'
	});
	let query = User.findOne(findObj).select({password: 0, __v: 0, createdAt: 0, updatedAt: 0});
	query.then(user => {
		if(!user){
			// TODO: Respond with a specific error code
			logger.error({
				description: 'User not found.',
				func: 'verify', obj: 'AuthCtrl'
			});
			return res.status(400).send('User with this information does not exist.');
		}
		//TODO: Email user
		logger.info({
			description: 'User found. Sending email',
			func: 'verify', obj: 'AuthCtrl'
		});
		user.sendRecoveryEmail().then(() => {
			res.json({message: 'Email sent', status: 'SUCCESS'});
		}, error => {
			res.status(500).send('Error sending recovery email');
		});
	}, err => {
		logger.error({
			description: 'Error querying for user',
			err, func: 'verify', obj: 'AuthCtrl'
		});
		return res.status(500).send('Unable to verify token.');
	});
};
