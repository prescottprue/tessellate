'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.envs = undefined;

var _env = require('./env');

var envs = _interopRequireWildcard(_env);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var config = envs[process.env.NODE_ENV || 'production'];
console.log('config created:', config);
exports.default = config;
exports.envs = envs;