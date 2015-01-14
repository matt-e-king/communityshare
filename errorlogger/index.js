require('./server')(function (err, server) {
  if (err) throw err;
  server.listen(server.get('port'), function () {
    var host = this.address().address;
    var port = this.address().port;
    console.log('Listening at http://%s:%s', host, port);
  })
});