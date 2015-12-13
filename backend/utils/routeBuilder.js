/**
 * @description Utilites that build NodeJS routes from routes config
 */
import _ from 'lodash';
import logger from './logger';
/**
 * @description Export function that accepts app and sets up the routes based on the routes config
 */
module.exports = (app) => {
  return (config) => {
    setupRoutes(app, config);
  }
};

/**
 * @function setupRoutes
 * @description Setup each of the specified routes with the router
 */
function setupRoutes(app, routeConfig){
  var routeTypes = _.keys(routeConfig);
  //Loop over each category of routes
  _.each(routeTypes, (routeType) => {
    var routesArray = routeConfig[routeType];
    _.each(routesArray, (route) => {
      if(validateRoute(route)){
        app.route(route.endpoint)[route.type.toLowerCase()](route.controller);
      }
    });
  });
  /**
   * @function validateRoute
   * @description Check that route object has all required keys
   */
  function validateRoute(route){
    var requiredKeys = ["type", "endpoint", "controller"];
    var hasRequiredKeys = _.every(requiredKeys, (keyName) => {
      return _.has(route, keyName);
    });
    if(hasRequiredKeys && !_.isFunction(route.controller)){
      logger.log("WARNING: Route has invalid controller function: ", JSON.stringify(route));
    }
    return (hasRequiredKeys && _.isFunction(route.controller));
  }
}
