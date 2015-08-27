var _ = require('underscore');

module.exports = function(app){
  return function(config){
    setupRoutes(app, config);
  }
};

//Setup each of the specified routes with the router
function setupRoutes(app, routeConfig){
  var routeTypes = _.keys(routeConfig);
  //Loop over each category of routes
  _.each(routeTypes, function(routeType){
    var routesArray = routeConfig[routeType];
    _.each(routesArray, function(route){
      if(validateRoute(route)){
        app.route(route.endpoint)[route.type.toLowerCase()](route.controller);
      }
    });
  });
  //Check that route object has all required keys
  function validateRoute(route){
    var requiredKeys = ["type", "endpoint", "controller"];
    var hasRequiredKeys = _.every(requiredKeys, function(keyName){
      return _.has(route, keyName);
    });
    if(hasRequiredKeys && !_.isFunction(route.controller)){
      console.warn("WARNING: Route has invalid controller function: ", route);
    }
    return (hasRequiredKeys && _.isFunction(route.controller));
  }
}