module.exports = function (callback) {

  var express = require('express')
    , bodyParser = require('body-parser')
    , nodemailer = require('nodemailer')
    , fs = require('fs')
    , path = require('path')
    , root = this
    ;

  function emailErrorReport (req, res, next) {
    var dateTime = new Date().toLocaleString()
      , errorBody = JSON.stringify(req.body)
      ;

    var mailOptions = {
      from: root.config['gmail-username'],
      to: root.config['gmail-username'],
      subject: dateTime,
      text: errorBody
    };

    root.transporter.sendMail(mailOptions, function (err, info) {
      if (err) return res.status(500).end();
      else return res.status(200).end();
    });
  }

  var server = express();

  server.use(bodyParser.urlencoded({extended: true}));
  server.use(bodyParser.json({limit: '25mb'}));

  server.use(
    function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
      next();
    })
  ;

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