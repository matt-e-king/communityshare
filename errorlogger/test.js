var supertest = require('supertest');

describe('Community Share Error', function () {
  var test;

  before(function (done) {
    require('./server')(function (err, server) {
      if (err) throw err;
      test = server;
      done();
    });
  });

  it('POST an error to the server and send email', function (done) {
    var request = {"a": "b"};
    supertest(test)
      .post('/error-log')
      .send(request)
      .expect(200, done)
    ;
  });

});