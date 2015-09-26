// var mongoose = require('mongoose');
// var config = require('../backend/env/development');
var expect = require("chai").expect;
var AccountModel = require('../backend/models/account');
var Account = require('../backend/models/account').Account;
var AccountSchema = Account.base.modelSchemas.Account;

describe('AccountModel', () => {
  it('exists', () => {
    expect(AccountModel).to.exist;
  });
  it('sets correct model name', () => {
    expect(Account.modelName).to.equal('Account');
  });
  it('has methods', () => {
    expect(AccountSchema.methods).to.be.an('object');
  });
  describe('login method', () => {
    it('exists', () => {
      expect(AccountSchema.methods).to.respondTo('login');
    });
  });
  describe('logout method', () => {
    it('exists', () => {
      expect(AccountSchema.methods).to.respondTo('logout');
    });
  });
  describe('signup method', () => {
    it('exists', () => {
      expect(AccountSchema.methods).to.respondTo('signup');
    });
  });

  // it.skip('sets correct collection name', () => {
  //   console.log('AccountModel.Account.base:', AccountModel.base);
  //
  //   expect(AccountModel.base.collection.collectionName).to.equal('accounts');
  // });
});
