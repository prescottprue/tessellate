var request = require('supertest');
var mongoose = require('mongoose');
// var config = require('../backend/env/development');
var expect = require("chai").expect;
var app = {};
var server, port;

//describe('Server', function() {
  // var server = require('../app');
  // beforeEach(function(next){
  //   app.server = server.listen(function () {
  //     // store port when it ready
  //     port = app.server.address().port;
  //     // and go to tests
  //     next();
  //   });
  // });
  // // tests here
  // afterEach(function(){
  //   if(app){
  //     app.server.close();
  //   }
  // });
  // describe('config', function(){
  //   it('exists', function(){
  //     console.log('app.server:', app.server);
  //     console.log('app:', app);
  //     expect(app).to.exist;
  //   });
  // });
  // beforeEach(function(done) {
  //   // In our tests we use the test db
  // });
  // describe('Account', function() {
  //   it('should return error trying to save duplicate username', function(done) {
  //     var profile = {
  //       username: 'vgheri',
  //       password: 'test',
  //       email: 'test@test.com',
  //       name: 'Test Guy'
  //     };
  //   request(url)
	// .post('/api/profiles')
	// .send(profile)
  //   // end handles the response
	// .end(function(err, res) {
  //     if (err) {
  //       throw err;
  //     }
  //     // this is should.js syntax, very clear
  //     res.should.have.status(400);
  //     done();
  //   });
  // });
// });
