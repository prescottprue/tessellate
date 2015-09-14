var gulp = require('gulp');
nodemon = require('gulp-nodemon'),
apidoc = require('gulp-apidoc');

var conf = require('./config.json');

//Node Server
gulp.task('serve', function () {
  nodemon({
    script: 'server.js', 
    ext: 'js html', 
    env: { 'NODE_ENV': 'local' }
  })
});

//Generate api documentation
gulp.task('docs', function(){
  apidoc.exec({
    src: conf.serverFolder + '/contollers',
    dest: conf.clientFolder + '/docs'
  });
});

gulp.task('default', ['serve']);
