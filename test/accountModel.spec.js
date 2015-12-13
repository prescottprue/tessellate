// var mongoose = require('mongoose');
import { expect } from 'chai';
process.env.NODE_ENV = 'test';
import AccountModel from '../backend/models/account';
import { Account } from '../backend/models/account';
let AccountSchema = Account.base.modelSchemas.Account;
let mockAccount;
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
    // beforeEach(() => {
    //   mockAccount = new Account({email: 'test@test.com', username: 'test'});
    // });
    it('exists', () => {
      expect(AccountSchema.methods).to.respondTo('login');
    });
    // it('handles email and username', () => {
    //   mockAccount.login('password');
    // });
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
