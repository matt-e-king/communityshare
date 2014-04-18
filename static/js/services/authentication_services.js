(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.authentication',
    [
      'ngResource',
      'communityshare.services.user'
    ])

  module.factory(
    'Session',
    function() {
      var Session = {};
      Session.activeUser = undefined;
      return Session;
    });

  module.factory(
    'Authenticator',
    function($q, $http, User, Session) {
      var Authenticator = {};
      Authenticator.clean = function() {
        $http.defaults.headers.common['Authorization'] = '';
      }
      Authenticator.authenticateWithEmailAndPassword =
        function(email, password) {
          $http.defaults.headers.common['Authorization'] = 
            'Basic:' + email + ':' + password;
          var userPromise = User.getByEmail(email);
          userPromise.then(
            function(user) {
              Session.activeUser = user;
            },
            function(response) {
            }
          );
          return userPromise;
        };
      return Authenticator;
    }
  );

})();
