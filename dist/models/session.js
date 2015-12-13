'use strict';

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _db = require('./../utils/db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SessionSchema = new _mongoose2.default.Schema({
	accountId: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Account' },
	active: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now, index: true },
	endedAt: { type: Date, index: true },
	updatedAt: { type: Date, default: Date.now, index: true }
});

SessionSchema.set('collection', 'sessions');
/*
 * Construct `User` model from `UserSchema`
 */
_db2.default.tessellate.model('Session', SessionSchema);

/*
 * Make model accessible from controllers
 */
var Session = _db2.default.tessellate.model('Session');
Session.collectionName = SessionSchema.get('collection');

exports.Session = _db2.default.tessellate.model('Session');