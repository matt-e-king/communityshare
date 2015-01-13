(function () {

  var express = require('express')
    , fs = require('fs')
    , path = require('path')
    , root = this
    ;

  function sendErrorReport (req, res, next) {

  }

  var server = express();

  var config = path.join(__dirname, 'config.json');

  fs.readFile(config, 'utf8', function (err, config) {
    if (err) throw err;
    root.config = JSON.parse(config);
    var port = root.config.port;
    server.listen(port, function () {
      console.log('Listening on port %s', port);
    });
  });

  server.post('/error-log',
    function (req, res, next) {
      return next();
    }, sendErrorReport)
  ;

})();