var logger = require('./logger');
exports.getUserFromRequest = (req) => {
 if(!req.user){
   logger.log({description: 'User does not exist in request.', user: req.user, func: 'getUserFromRequest'});
   return null;
 }
 logger.log({description: 'Getting user from request.', user: req.user || null, func: 'getUserFromRequest'});
 var userData = {};
 //Find out what token type it is
 if(req.user.un){
   logger.log({description: 'Token is AuthRocket format.', func: 'getUserFromRequest'});
   //Token is an authrocket token
   userData.username = req.user.un;
   userData.name = req.user.n || null;
   userData.uid = req.user.uid || null;
   userData.orgs = req.user.m.map((group)=> {
     return {name: group.o, id: group.oid};
   });
 } else if(req.user.accountId){
   logger.log({description: 'Token is default format.', user: req.user, func: 'getUserFromRequest'});
   userData.id = req.user.accountId;
   userData.username = req.user.username;
 } else {
   logger.error({description: 'Unrecognized token format.', func: 'getUserFromRequest'});
 }
 //TODO: Get user from multiple token types
 return userData;
}
