var gulp = require('gulp');
nodemon = require('gulp-nodemon'),
apidoc = require('gulp-apidoc'),
notify = require('gulp-notify'),
template = require('gulp-template'),
rename = require('gulp-rename'),
browserSync = require('browser-sync').create(),
reload = browserSync.reload;

var conf = require('./config.json');
var assets = require('./assets');
var refBuilder = require('./lib/refBuilder');

var paths = {
  styles: ['./public/**/*.css'],

  assets: ['./public/assets/'],
  scripts: [
    './public/**/*.js'
  ],
  html: [
  './public/**/*.html',
  './public/index.html'
  ],

  server: {
    js: ['./backend/**/*.js']
  }
};
var locatedStyleAssets = locateAssets('styles');
var locatedAppAssets = locateAssets('app');
var locatedVendorAssets = locateAssets('vendor');

//Backend Node Server
gulp.task('serve', function () {
  nodemon({
    script: 'server.js',
    port: conf.server.port,
    ext: 'js',
    watch: conf.server.folder,
    env: { 'NODE_ENV': 'local' }
  });
});

//Generate api documentation
gulp.task('docs', function(){
  apidoc.exec({
    src: conf.server.folder + '/contollers',
    dest: conf.client.folder + '/docs'
  });
});

/** Build script and style tags to place into HTML in dev folder
 */
gulp.task('assetTags:dev', function () {
  return gulp.src(conf.client.folder + '/index-template.html')
    .pipe(template({scripts:refBuilder.buildScriptTags('local'), styles:refBuilder.buildStyleTags('local')}))
    // Writes script reference to index.html dist/ folder
    .pipe(rename('index.html'))
    .pipe(gulp.dest(conf.client.folder))
    .pipe(notify({message: 'Asset Tags Built'}));
});
gulp.task('client', ['assetTags:dev'], function() {
  browserSync.init({
    port: conf.client.port,
    server: {
      baseDir: "./"+conf.client.folder+"/"
    }
  });
  gulp.watch([conf.client.folder + '/**', 'assets.js', '!' + conf.client.folder + '/bower/**'], reload);
});

gulp.task('default', [ 'assetTags:dev', 'serve', 'client']);


function locateAssets(assetType){
	if(assets[assetType]){
		return assets[assetType].map(function(asset){
	    return './' + conf.clientFolder + '/' + asset;
	  });
	} else {
		console.error('Asset type does not exist.', assetType);
	}
}