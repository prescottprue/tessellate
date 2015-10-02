var request = require('supertest');
var mongoose = require('mongoose');
var expect = require("chai").expect;
process.env.NODE_ENV = 'test';
var AccountsCtrl = require('../backend/controllers/accounts');

describe('AccountsCtrl', function() {
  it('has get method', function() {
    expect(AccountsCtrl.get).to.exist;
  });
});
