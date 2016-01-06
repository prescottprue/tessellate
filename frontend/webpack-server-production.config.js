'use strict';
var path = require('path');
var createWebpackConfig = require('./lib/create-webpack-config');
var indexServerPath = path.resolve(__dirname, 'lib', 'index-server.js');
module.exports = createWebpackConfig({
  dev: false,
  entry: [indexServerPath],
  target: 'node',
  outputFilename: 'bundle-server.js',
  outputLibraryTarget: 'umd'
});
