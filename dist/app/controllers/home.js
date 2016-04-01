'use strict';

/**
 * New project page
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.index = index;
function index(req, res) {
  res.render('home/index', {
    title: 'Tessellate'
  });
}