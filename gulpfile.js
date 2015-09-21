var gulp = require('gulp');
nodemon = require('gulp-nodemon'),
apidoc = require('gulp-apidoc'),
notify = require('gulp-notify'),
template = require('gulp-template'),
rename = require('gulp-rename'),
browserSync = require('browser-sync').create(),
shell = require('gulp-shell'),
_ = require('lodash'),
reload = browserSync.reload;

var config = require('./config.json');
var assets = require('./assets');
var refBuilder = require('./lib/refBuilder');

var locatedStyleAssets = locateAssets('styles');
var locatedAppAssets = locateAssets('app');
var locatedVendorAssets = locateAssets('vendor');

var linkCommandArray = buildLinkCommands('link');
var unlinkCommandArray = buildLinkCommands('unlink');

//Start livereload client/frontend server
gulp.task('client', ['assetTags:dev'], function() {
  browserSync.init({
    port: config.client.port,
    server: {
      baseDir: "./"+config.client.folder+"/"
    }
  });
  gulp.watch([config.client.folder + '/**', 'assets.js', '!' + config.client.folder + '/bower/**'], reload);
});

//TODO: Make tasks to serve other environments
//Backend Node Server
gulp.task('serve', function () {
  nodemon({
    script: 'server.js',
    port: config.server.port,
    ext: 'js',
    watch: config.server.folder,
    env: { 'NODE_ENV': 'local' }
  });
});


//Generate api documentation
gulp.task('docs', function(){
  apidoc.exec({
    src: config.server.folder + '/contollers',
    dest: config.client.folder + '/docs'
  });
});

/** Build script and style tags to place into HTML in dev folder
 */
gulp.task('assetTags:dev', function () {
  return gulp.src(config.client.folder + '/index-template.html')
    .pipe(template({scripts:refBuilder.buildScriptTags('local'), styles:refBuilder.buildStyleTags('local')}))
    // Writes script reference to index.html dist/ folder
    .pipe(rename('index.html'))
    .pipe(gulp.dest(config.client.folder))
    .pipe(notify({message: 'Asset Tags Built'}));
});

//Link list of modules
gulp.task('link', shell.task(linkCommandArray));

//Unlink list of modules
gulp.task('unlink', shell.task(unlinkCommandArray));

//Default task: Build asset tags, start backend server
gulp.task('default', [ 'assetTags:dev', 'serve', 'client']);

//----------------------- Utility Functions -------------------------------\\
//Build an array of commands to link/unlink modules

function buildLinkCommands(linkAction){
  //TODO: Don't allow package types that don't follow standard link/unlink pattern
  // const allowedPackageLinkTypes = ['bower', 'npm'];
  if(!linkAction){
    linkAction = 'link';
  }
  const linkTypes = _.keys(config.linkedModules);
  const messageCommand = 'echo ' + linkAction + 'ing local modules';
  var commands = [messageCommand];
  //Each type of packages to link
  _.each(linkTypes, function (type){
    //Check that package link patter is supported
    // if(!_.contains(allowedPackageLinkTypes, type)){
    //   console.error('Invalid package link type');
    //   return;
    // }
    //Each package of that type
    _.each(config.linkedModules[type], function (packageName){
      commands.push(type + ' ' + linkAction  + ' ' + packageName);
    });
  });
  console.log('Returning link commands:', commands);
  return commands;
}

//Add folder name to asset list
function locateAssets(assetType){
	if(assets[assetType]){
		return assets[assetType].map(function(asset){
	    return './' + config.clientFolder + '/' + asset;
	  });
	} else {
		console.error('Asset type does not exist.', assetType);
	}
}