var request = require('supertest');
var mongoose = require('mongoose');
// var config = require('../backend/env/development');
var expect = require("chai").expect;
var AccountsCtrl = require('../backend/controllers/accounts');

describe('AccountsCtrl', function() {
  it('has get method', function() {
    expect(AccountsCtrl.get).to.exist;
  });
});
