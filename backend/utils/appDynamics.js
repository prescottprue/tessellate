/** App Dynamics Util
 *	@description standardized interface file storage so the service/platform used for storage can be changed without affecting file storage calls
 */
var _ = require('lodash');
var conf  = require('../config/default').config;
var ad = require("appdynamics");
var logger = require('./logger');

exports.init = (bucketName) => {
	logger.log({description: 'App Dynamics config called.', func: 'init', obj: 'appDynamics'});
  if (!process.env.APP_DYNAMICS_KEY) {
    logger.error({description: 'App Dynamics environment variable has not been set.', func: 'init', obj: 'appDynamics'});
    return;
  }
  ad.profile({
      controllerHostName: 'paid150.saas.appdynamics.com',
      controllerPort: 443, // If SSL, be sure to enable the next line
      // controllerSslEnabled: true, // Optional - use if connecting to controller via SSL
      accountName: 'Kyper',
      accountAccessKey: process.env.APP_DYNAMICS_KEY,
      applicationName: 'Tessellate',
      tierName: 'Web',
      nodeName: 'process' // The controller will automatically append the node name with a unique number
  });
};
