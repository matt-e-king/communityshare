module.exports = function (callback) {

  var express = require('express')
    , nodemailer = require('nodemailer')
    , fs = require('fs')
    , path = require('path')
    , root = this
    ;

  function emailErrorReport (req, res, next) {
    var mailOptions = {
      from: root.config['gmail-username'],
      to: root.config['gmail-username'],
      subject: 'hello world!',
      text: 'hello!'
    };

    root.transporter.sendMail(mailOptions, function (err, info) {
      console.log(err);
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
    if (err) callback(err);

    root.config = JSON.parse(config);

    root.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: root.config['gmail-username'],
        pass: root.config['gmail-password']
      }
    });

    server.set('port', root.config['port']);

    callback(null, server);
  });

}