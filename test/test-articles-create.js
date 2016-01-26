'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const test = require('ava');
const request = require('supertest');
const app = require('../server');
const cleanup = require('./helper').cleanup;
const User = mongoose.model('User');
const Project = mongoose.model('Project');
const agent = request.agent(app);

const _user = {
  email: 'foo@email.com',
  name: 'Foo bar',
  username: 'foobar',
  password: 'foobar'
};


test.before(cleanup);
test.before(async t => {
  const user = new User(_user);
  return await user.save(t.end);
});

test.beforeEach(t => {
  agent
  .post('/users/session')
  .field('email', _user.email)
  .field('password', _user.password)
  .expect('Location', '/')
  .expect('Content-Type', /text/)
  .end(t.end);
});

test.after(cleanup);


test('POST /projects - when not logged in - should redirect to /login', t => {
  request(app)
  .get('/projects/new')
  .expect('Content-Type', /plain/)
  .expect(302)
  .expect('Location', '/login')
  .expect(/Redirecting/)
  .end(t.end);
});


test('POST /projects - invalid form - should respond with error', t => {
  agent
  .post('/projects')
  .field('title', '')
  .field('body', 'foo')
  .expect('Content-Type', /text/)
  .expect(422)
  .expect(/Project title cannot be blank/)
  .end(async err => {
    const count = await Project.count().exec();
    t.ifError(err);
    t.same(count, 0, 'Count should be 0');
    t.end();
  });
});


test('POST /projects - valid form - should redirect to the new project page', t => {
  agent
  .post('/projects')
  .field('title', 'foo')
  .field('body', 'bar')
  .expect('Content-Type', /plain/)
  .expect('Location', /\/projects\//)
  .expect(302)
  .expect(/Redirecting/)
  .end(async err => {
    const count = await Project.count().exec();
    t.ifError(err);
    t.same(count, 1, 'Count should be 1');
    t.end();
  });
});
