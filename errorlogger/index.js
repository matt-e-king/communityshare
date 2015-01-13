(function () {

  var express = require('express')
    , nodemailer = require('nodemailer')
    , fs = require('fs')
    , path = require('path')
    , root = this
    ;

  function emailErrorReport (req, res, next) {
    root.transporter.sendEmail({
      from: root.config['gmail-username'],
      to: root.config['gmail-username'],
      subject: 'hello world!',
      text: 'hello!'
    }, function (err, res) {
      if (err) return res.status(500).end();
      else return res.status(200).end();
    });
  }

  var server = express();

  server.post('/error-log',
    function (req, res, next) {
      return next();
    }, emailErrorReport)
  ;

  var config = path.join(__dirname, 'config.json');

  fs.readFile(config, 'utf8', function (err, config) {
    if (err) throw err;

    root.config = JSON.parse(config);

    root.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: root.config['gmail-username'],
        pass: root.config['gmail-password']
      }
    });

    var port = root.config['port'];

    server.listen(port, function () {
      console.log('Listening on port %s', port);
    });
  });

  module.exports = server;

})();