import request from 'supertest';
import app from '../dist/index';
import { expect } from 'chai';

describe('GET /apps', () => {
  it('responds with json', (done) => {
    request(app)
      .get('/apps')
      .set('Accept', 'application/json')
      .end((err, res) => {
        if(err) {
          console.error('Error requesting /apps', JSON.stringify(err));
        } else {
          expect(res).to.be.defined;
        }
        done()
      });
  });
});
