'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @description Export function that accepts app and sets up the routes based on the routes config
 */
/**
 * @description Utilites that build NodeJS routes from routes config
 */
module.exports = function (app) {
  return function (config) {
    setupRoutes(app, config);
  };
};

/**
 * @function setupRoutes
 * @description Setup each of the specified routes with the router
 */
function setupRoutes(app, routeConfig) {
  var routeTypes = _lodash2.default.keys(routeConfig);
  //Loop over each category of routes
  _lodash2.default.each(routeTypes, function (routeType) {
    var routesArray = routeConfig[routeType];
    _lodash2.default.each(routesArray, function (route) {
      if (validateRoute(route)) {
        app.route(route.endpoint)[route.type.toLowerCase()](route.controller);
      }
    });
  });
  /**
   * @function validateRoute
   * @description Check that route object has all required keys
   */
  function validateRoute(route) {
    var requiredKeys = ["type", "endpoint", "controller"];
    var hasRequiredKeys = _lodash2.default.every(requiredKeys, function (keyName) {
      return _lodash2.default.has(route, keyName);
    });
    if (hasRequiredKeys && !_lodash2.default.isFunction(route.controller)) {
      _logger2.default.log("WARNING: Route has invalid controller function: ", JSON.stringify(route));
    }
    return hasRequiredKeys && _lodash2.default.isFunction(route.controller);
  }
}