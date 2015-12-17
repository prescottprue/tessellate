'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.production = exports.staging = exports.development = exports.local = undefined;

var _local2 = require('./local');

var _local3 = _interopRequireDefault(_local2);

var _development2 = require('./development');

var _development3 = _interopRequireDefault(_development2);

var _staging2 = require('./staging');

var _staging3 = _interopRequireDefault(_staging2);

var _production2 = require('./production');

var _production3 = _interopRequireDefault(_production2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.local = _local3.default;
exports.development = _development3.default;
exports.staging = _staging3.default;
exports.production = _production3.default;