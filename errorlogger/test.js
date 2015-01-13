var supertest = require('supertest');

describe('Community Share Error', function () {
  var server;

  before(function (done) {
    server = require('./index');
    done();
  });

  it('POST an error to the server and send email', function (done) {
    var request = {};

    server
      .get('/error-log')
      .send(request)
      .expect(200, done)
    ;
  });

});