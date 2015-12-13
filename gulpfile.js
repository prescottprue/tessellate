var gulp = require('gulp');
nodemon = require('gulp-nodemon'),
apidoc = require('gulp-apidoc'),
notify = require('gulp-notify'),
template = require('gulp-template'),
rename = require('gulp-rename'),
browserSync = require('browser-sync').create(),
shell = require('gulp-shell'),
_ = require('lodash'),
reload = browserSync.reload,
mocha = require('gulp-mocha');
require('babel-core/register');
var runSequence = require('run-sequence');

var config = require('./config.json');
var assets = require('./assets');
var refBuilder = require('./backend/lib/refBuilder');

var locatedStyleAssets = locateAssets('styles');
var locatedAppAssets = locateAssets('app');
var locatedVendorAssets = locateAssets('vendor');

//Start livereload client/frontend server
gulp.task('client', ['assetTags:dev'], function() {
  browserSync.init({
    port: config.client.port,
    server: {
      baseDir: "./"+config.client.folder+"/"
    }
  });
});
gulp.task('build', shell.task(['babel backend --out-dir dist']));

gulp.task('watch', shell.task(['babel backend --out-dir dist --watch']));

gulp.task('test', function(){
  gulp.src('test/**/*.spec.js')
   .pipe(mocha({
       reporter: 'spec',
       clearRequireCache: true,
       ignoreLeaks: true
   }));
});
//Run test with mocha and generate code coverage with istanbul
gulp.task('coverage', ['lint-src', 'lint-test'], function(done) {
  require('babel-core/register');
  gulp.src(['src/**/*.js', '!gulpfile.js', '!dist/**/*.js', '!examples/**', '!node_modules/**'])
    .pipe($.istanbul({ instrumenter: isparta.Instrumenter }))
    .pipe($.istanbul.hookRequire())
    .on('finish', function() {
      return test()
        .pipe($.istanbul.writeReports())
        .on('end', done);
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

//Deploy to staging environment of Elastic Beanstalk
gulp.task('deploy:staging', shell.task(['eb use ' + config.stagingEnvName, 'eb deploy']));

//Deploy to staging environment of Elastic Beanstalk
gulp.task('deploy:prod', shell.task(['eb use ' + config.productionEnvName, 'eb deploy']));

//Link list of modules
gulp.task('link', shell.task(buildLinkCommands('link')));

//Unlink list of modules
gulp.task('unlink', shell.task(buildLinkCommands('unlink')));

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
  _.each(linkTypes, function (packageType){
    //Check that package link patter is supported
    // if(!_.contains(allowedPackageLinkTypes, packageType)){
    //   console.error('Invalid package link packageType');
    //   return;
    // }
    //Each package of that packageType
    _.each(config.linkedModules[packageType], function (packageName){
      commands.push(packageType + ' ' + linkAction  + ' ' + packageName);
      //Add command to install the original version after unlinking
      if(linkAction === 'unlink'){
        commands.push(packageType + ' install ' + packageName);
      }
    });
  });
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
