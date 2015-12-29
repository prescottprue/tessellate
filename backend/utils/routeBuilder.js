/**
 * @description Utilites that build NodeJS routes from routes config
 */
import { each, has, every, isFunction, keys } from 'lodash';
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
  let routeTypes = keys(routeConfig);
  //Loop over each category of routes
  each(routeTypes, (routeType) => {
    let routesArray = routeConfig[routeType];
    each(routesArray, (route) => {
      if(validateRoute(route)){
        if(route.middleware && route.type.toLowerCase() === 'post') {
          app.post(route.endpoint, route.middleware, route.controller);
        } else {
          app.route(route.endpoint)[route.type.toLowerCase()](route.controller);
        }
      }
    });
  });
  /**
   * @function validateRoute
   * @description Check that route object has all required keys
   */
  function validateRoute(route){
    var requiredKeys = ["type", "endpoint", "controller"];
    var hasRequiredKeys = every(requiredKeys, (keyName) => {
      return has(route, keyName);
    });
    if(hasRequiredKeys && !isFunction(route.controller)){
      logger.log("WARNING: Route has invalid controller function: ", JSON.stringify(route));
    }
    return (hasRequiredKeys && isFunction(route.controller));
  }
}
