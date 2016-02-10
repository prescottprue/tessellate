'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadAndRemoveLocal = exports.uploadFileToBucket = exports.uploadAvatar = exports.uploadImage = undefined;


/** Upload a file to the image bucket then remove
 * @function uploadImage
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */

var uploadImage = exports.uploadImage = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(file) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return uploadAndRemoveLocal(_config2.default.contentSettings.images.bucket, file);

          case 2:
            return _context.abrupt('return', _context.sent);

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function uploadImage(_x) {
    return ref.apply(this, arguments);
  };
}();

/** Upload an avatar image file to the image bucket with the avatar prefix then remove the local copy
 * @function uploadAvatar
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */

var uploadAvatar = exports.uploadAvatar = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(file) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            file.key = _config2.default.contentSettings.avatar.prefix + '/' + file.key;
            _context2.next = 4;
            return uploadImage(file);

          case 4:
            return _context2.abrupt('return', _context2.sent);

          case 7:
            _context2.prev = 7;
            _context2.t0 = _context2['catch'](0);

            console.error('Error uploading avatar: ', _context2.t0.toString());
            throw _context2.t0;

          case 11:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 7]]);
  }));

  return function uploadAvatar(_x2) {
    return ref.apply(this, arguments);
  };
}();

/** Upload a local file to file storage
 * @function uploadFile
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */


var uploadFileToBucket = exports.uploadFileToBucket = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(bucket, fileData) {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return s3.uploadFileToBucket(bucket, fileData);

          case 2:
            return _context3.abrupt('return', _context3.sent);

          case 3:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function uploadFileToBucket(_x3, _x4) {
    return ref.apply(this, arguments);
  };
}();

/** Upload a local file to S3 bucket the remove the local file
 * @function uploadAndRemoveLocal
 * @param {string} bucketName - Name of bucket to upload to
 * @param {object} fileData - Object containing file information
 * @param {string} fileData.key - Key of file to save
 * @param {string} fileData.content - File contents in string form
 */

var uploadAndRemoveLocal = exports.uploadAndRemoveLocal = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(bucket, file) {
    var uploadedFile;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _context4.next = 3;
            return uploadFileToBucket(bucket, file);

          case 3:
            uploadedFile = _context4.sent;
            _context4.next = 6;
            return removeLocalFile(file.localPath);

          case 6:
            return _context4.abrupt('return', uploadedFile);

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4['catch'](0);

            console.log('Error uploading and removing local', _context4.t0.toString());
            return _context4.abrupt('return', _context4.t0);

          case 13:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[0, 9]]);
  }));

  return function uploadAndRemoveLocal(_x5, _x6) {
    return ref.apply(this, arguments);
  };
}();

/** Remove a local file
 * @function uploadImage
 * @param {string} path - Path of local file to remove
 */


exports.removeLocalFile = removeLocalFile;

var _config = require('../../config/config');

var _config2 = _interopRequireDefault(_config);

var _s = require('./s3');

var s3 = _interopRequireWildcard(_s);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * @description Interface for External File Storage (currently S3)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */

;;function removeLocalFile(path) {
  return new Promise(function (resolve, reject) {
    (0, _rimraf2.default)(path, {}, function (error) {
      if (error) {
        console.log('Error deleting local file', error.toString());
        return reject(error);
      }
      resolve();
    });
  });
}