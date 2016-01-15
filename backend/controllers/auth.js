/**
 * @description Authentication controller
 */
import mongoose from 'mongoose';
import url from 'url';
import { has } from 'lodash';
import logger from '../utils/logger';
import { Account } from '../models/account';
import { Session } from '../models/session';
import AuthRocket from 'authrocket';
import jwt from 'jsonwebtoken';
import config from '../config/default';
import google from 'googleapis';
let authRocketEnabled = config.authRocket ? config.authRocket.enabled : false;
let authrocket = new AuthRocket();
/**
 * @api {post} /signup Sign Up
 * @apiDescription Sign up a new account and start a session as that new account
 * @apiName Signup
 * @apiGroup Auth
 *
 * @apiParam {Number} id Accounts unique ID.
 * @apiParam {String} username Accountname of account to signup as.
 * @apiParam {String} [title] Title of account to signup as.
 * @apiParam {String} email Email of account to signup as.
 * @apiParam {String} password Password of account to signup as.
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "John",
 *       "title": "Doe",
 *     	 "role":"admin",
 *     }
 *
 */
export function signup(req, res, next) {
	var query;
	logger.log({
		description: 'Signup request.', body: req.body,
		func: 'signup', obj: 'AuthCtrls'
	});
	//Check for username or email
	if(!has(req.body, "username") && !has(req.body, "email")){
		return res.status(400).json({
			code:400,
			message:"Username or Email required to signup"
		});
	}
	if(authRocketEnabled){
		authrocket.signup(req.body).then((signupRes) => {
			logger.log({
				description: 'Successfully signed up through authrocket.',
				response: signupRes, func: 'signup', obj: 'AuthCtrls'
			});
			//TODO: Record user within internal auth system
			res.send(signupRes);
		}, (err) => {
			logger.error({
				description: 'Error signing up through auth rocket.',
				error: err, func: 'signup', obj: 'AuthCtrls'
			});
			res.send(err);
		});
	} else {
		//Basic Internal Signup
		if(has(req.body, "username")){
			query = Account.findOne({"username":req.body.username}); // find using username field
		} else {
			query = Account.findOne({"email":req.body.email}); // find using email field
		}
		query.then((result) => {
			if(result){ //Matching account already exists
				// TODO: Respond with a specific error code
				return res.status(400).send('Account with this information already exists.');
			}
			//account does not already exist
			//Build account data from request
			var account = new Account(req.body);
			// TODO: Start a session with new account
			account.createWithPass(req.body.password).then((newAccount) => {
				res.send(newAccount);
			}, (err) => {
				res.status(500).json({
					code:500,
					message:'Error hashing password',
					error:err
				});
			});
		}, (err) => {
			logger.error({
				description: 'Error querying for account.',
				error: err, func: 'signup', obj: 'AuthCtrl'
			});
			res.status(500).send('Error querying for account.');
		});
	}
};

/**
 * @api {post} /login Login
 * @apiDescription Login and start a new session.
 * @apiName Login
 * @apiGroup Auth
 *
 * @apiParam {Number} id Users unique ID.
 * @apiParam {String} username Username of user to login as. Email must be provided if username is not.
 * @apiParam {String} [email] Email of user to login as. Can be used instead of username.
 * @apiParam {String} password Password of user to login as.
 *
 * @apiSuccess {Object} userData Object containing users data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       account:{
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
	let query;
	if((!has(req.body, "username") && !has(req.body, "email")) || !has(req.body, "password")){
		return res.status(400).send("Username/Email and password required to login");
	}
	let loginData =  {password: req.body.password};
	if (has(req.body, 'username')) {
		if(req.body.username.indexOf('@') !== -1){
			loginData.email = req.body.username;
		} else {
			loginData.username = req.body.username
		}
	}
	if(authRocketEnabled){
		//Authrocket login
		//Remove email to avoid Auth Rocket error
		if (has(loginData, 'email')) {
			delete loginData.email;
		}
		if(!has(req.body, 'username')) {
			return res.status(400).send('Username is required to login.');
		}
		logger.log({
			description: 'calling auth rocket with:',
			data: loginData, func: 'login', obj: 'AuthCtrls'
		});
		authrocket.login(loginData).then((loginRes) => {
			logger.log({
				description: 'Successfully logged in through authrocket.',
				func: 'login', obj: 'AuthCtrls'
			});
			//TODO: Record login within internal auth system
			//TODO: Return account along with token data
			if(loginRes.token){
				let token = jwt.decode(loginRes.token);
				logger.log({
					description: 'token', token: token,
					func: 'login', obj: 'AuthCtrls'
				});
				if(!process.env.AUTHROCKET_JWT_SECRET){
					logger.error({
						description: 'Authrocket secret not available to verify token',
						func: 'login', obj: 'AuthCtrls'
					});
				} else{
					let verify = jwt.verify(loginRes.token, process.env.AUTHROCKET_JWT_SECRET);
					logger.log({
						description: 'verify', verify: verify,
						func: 'login', obj: 'AuthCtrls'
					});
				}
			}
			let account = {username: token.un, name: token.n, groups: token.m || []};
			//Convert groups list to object from token if org/group data exists
			if(account.groups.length >= 1 && account.groups[0].o){
				account.groups = account.groups.map(function(group){
					return {name: group.o, id: group.oid};
				});
			}
			let response = {account: account, token: loginRes.token};
			res.send(response);
		}, (err) => {
			logger.error({
				description: 'Error logging in through auth rocket.',
				error: err, func: 'login', obj: 'AuthCtrls'
			});
			res.status(400).send('Invalid Credentials');
		});
	} else {
		//Basic Internal login
		if(has(loginData, 'username')){
			query = Account.findOne({'username':loginData.username})
				.populate({path:'groups', select:'name'})
				.select({__v: 0, createdAt: 0, updatedAt: 0}); // find using username field
		} else {
			query = Account.findOne({'email':loginData.email})
			.populate({path:'groups', select:'name'})
			.select({__v: 0, createdAt: 0, updatedAt: 0}); // find using email field
		}
		query.then(currentAccount => {
			if(!currentAccount){
				logger.error({
					description: 'Account not found.',
					func: 'login', obj: 'AuthCtrl'
				});
				return res.status(409).send('Account not found.');
			}
			currentAccount.login(req.body.password).then(loginRes => {
				logger.log({
					description: 'Login Successful.',
					func: 'login', obj: 'AuthCtrl'
				});
				res.send(loginRes);
			}, err => {
				//TODO: Handle wrong password
				logger.error({
					description: 'Login Error.', error: err,
					func: 'login', obj: 'AuthCtrl'
				});
				res.status(400).send('Error logging in.');
			});
		}, err => {
			logger.error({
				description: 'Login error', error: err,
				func: 'login', obj: 'AuthCtrl'
			});
			res.status(500).send('Error logging in.');
		});
	}
};

/**
 * @api {post} /logout Logout
 * @apiDescription Logout the currently logged in account and invalidate their token.
 * @apiName Logout
 * @apiGroup Auth
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Logout successful"
 *     }
 *
 */
export function logout(req, res, next) {
	//TODO:Invalidate token
	logger.log({
		description: 'Logout called.',
		authRocketEnabled: authRocketEnabled,
		body: req.body,
		func: 'logout', obj: 'AuthCtrl'
	});
	if(authRocketEnabled){
		var token;
		if(req.body && req.body.token){
			token = req.body.token;
		} else if(req.headers && (req.headers.authorization || req.header('Authorization'))){
			logger.log({
				description: 'Getting token from headers.',
				headers: req.headers, func: 'logout', obj: 'AuthCtrl'
			});
			var header = req.headers.authorization || req.header('Authorization');
			token = header.replace("Bearer ", "");
		} else {
			logger.warn({
				description: 'Token required to logout.',
				func: 'logout', obj: 'AuthCtrl'
			});
			return res.status(401).send('Token required to logout.');
		}
		logger.log({
			description: 'Attempting log out through authrocket.',
			token: token, func: 'logout', obj: 'AuthCtrl'
		});
		authrocket.logout(token).then((logoutRes) => {
			logger.log({
				description: 'Successfully logged out through authrocket.',
				response: logoutRes, func: 'logout', obj: 'AuthCtrl'
			});
			res.send({message:'Logout successful.'});
		}, (err) => {
			logger.error({
				description: 'Error ending session.', error: err,
				func: 'logout', obj: 'AuthCtrl'
			});
			res.status(500).send(err);
		});
	} else {
		//TODO: Handle user not being in req.user
		var account = new Account(req.user);
		account.endSession().then(() => {
			logger.log({
				description: 'Successfully ended session',
				func: 'logout', obj: 'AuthCtrl'
			});
			res.send('Logout successful.');
		}, (err) => {
			logger.error({
				description: 'Error ending session.', error: err,
				func: 'logout', obj: 'AuthCtrl'
			});
			res.status(500).send({message:'Error ending session.'});
		});
	}
};

/**
 * @api {put} /account Verify
 * @apiDescription Verify token and get matching account's data.
 * @apiName Verify
 * @apiGroup Auth
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
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
	//TODO:Actually verify account instead of just returning account data
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
	let query = Account.findOne(findObj).select({password: 0, __v: 0, createdAt: 0, updatedAt: 0});
	query.then((result) => {
		if(!result){ //Matching account already exists
			// TODO: Respond with a specific error code
			logger.error({
				description: 'Account not found.',
				error: err, func: 'verify', obj: 'AuthCtrl'
			});
			return res.status(400).send('Account with this information does not exist.');
		}
		res.json(result);
	}, (err) => {
		logger.error({
			description: 'Error querying for account',
			error: err, func: 'verify', obj: 'AuthCtrl'
		});
		return res.status(500).send('Unable to verify token.');
	});
};
/**
 * @api {post} /recover Recover
 * @apiDescription Recover an account though email
 * @apiName Verify
 * @apiGroup Auth
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
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
			description: 'Username or email required to recover account.',
			func: 'recover', obj: 'AuthCtrl'
		});
		res.send('Username or email required to recover account.');
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
	let query = Account.findOne(findObj).select({password: 0, __v: 0, createdAt: 0, updatedAt: 0});
	query.then(result => {
		if(!result){
			// TODO: Respond with a specific error code
			logger.error({
				description: 'Account not found.',
				func: 'verify', obj: 'AuthCtrl'
			});
			return res.status(400).send('Account with this information does not exist.');
		}
		//TODO: Email user
		logger.info({
			description: 'Account found. Sending email',
			func: 'verify', obj: 'AuthCtrl'
		});
		res.send('Email sent');
		// res.json(result);
	}, err => {
		logger.error({
			description: 'Error querying for account',
			err, func: 'verify', obj: 'AuthCtrl'
		});
		return res.status(500).send('Unable to verify token.');
	});
};
/**
 * @api {post} /recover Recover
 * @apiDescription Recover an account though email
 * @apiName Verify
 * @apiGroup Auth
 *
 * @apiSuccess {Object} accountData Object containing accounts data.
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
export function authUrl(req, res, next) {
	logger.debug({
		description: 'authUrl request.', query: req.query, body: req.body,
		func: 'googleAuthUrl', obj: 'AuthCtrl'
	});
	const enabledProviders = ['google'];
	if(!req.query || !req.query.provider || enabledProviders.indexOf(req.query.provider) === -1){
		return res.status(400).send('Invalid Authentication Provider');
	}
	let authUrl;
	switch(req.query.provider){
		case 'google':
			authUrl = googleAuthUrl(req.query.redirect);
			break;
		default:
			authUrl = googleAuthUrl(req.query.redirect);
	}
	if(!authUrl){
		return res.status(400).send('Error generating external auth url');
	}
	logger.debug({
		description: 'Responding with authUrl.', authUrl,
		func: 'authUrl', obj: 'AuthCtrl'
	});
	res.json(authUrl);
};
function googleAuthUrl(redirect) {
	const { id, secret, redirectUrl } = config.google.client;
	try {
		const oauth2Client = new google.auth.OAuth2(id, secret, redirect || redirectUrl);
		// generate a url that asks permissions for Google+ and Google Calendar scopes
		const scope = [
		  'https://www.googleapis.com/auth/plus.me'
		];
		const url = oauth2Client.generateAuthUrl({ scope });
		logger.debug({
			description: 'Google url generated.', url,
			func: 'googleAuthUrl', obj: 'AuthCtrl'
		});
		return url;
	} catch(err) {
		logger.error({
			description: 'Error generating auth url.', url,
			func: 'googleAuthUrl', obj: 'AuthCtrl'
		});
		return null;
	}
}
