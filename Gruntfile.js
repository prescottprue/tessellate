var conf = require('./config.json');
module.exports = function(grunt){
	var serverFolder = "backend/";
	var frontFolder = "public/";
	var mongoShutdownCmd = "db.getSiblingDB('admin').shutdownServer()";
	var dbShutdownCmd = 'mongo --eval "' + mongoShutdownCmd + '"';
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concurrent:{
			tasks:['watch','nodemon'],
			logCuncurrentOutput:true
		},
		watch:{
			server:{
				files:['Gruntfile.js', 'config/**', serverFolder + 'lib/**', serverFolder + 'controllers/**'],
				tasks:['nodemon']
			},
			docs:{
				files:[serverFolder + 'controllers/*.js'],
				tasks:['docs']
			}
		},
		nodemon:{
			local:{
				script: 'server.js',
				ignore:['node_modules/**', '.elasticbeanstalk'],
				options: {
          nodeArgs: ['--debug'],
	        env:{
	        	PORT:conf.port
	        }
        }
			}
		},
		apidoc: {
			app:{
				src: serverFolder+ "/controllers",
	    	dest: frontFolder + "docs/",
	    	options:{
	    		debug:true
	    	}
			}
		},
		shell: {
			killMongod:{
				command:dbShutdownCmd,
				options: {
          stdout: false,
          stderr: true,
          failOnError: false,
          execOptions: {
            cwd: '.'
          }
      	}
			},
    	mongodb: {
      	command: 'mongod --dbpath /data/db',
      	options: {
          async: true,
          stdout: true,
          stderr: true,
          failOnError: true,
          execOptions: {
            cwd: '.'
          }
      	}
  		}
		}
	});
	require('load-grunt-tasks')(grunt);
	grunt.registerTask('docs', ['apidoc'])
	grunt.registerTask('default', ['shell:mongodb', 'nodemon']);
};
