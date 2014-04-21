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
      Authenticator.setApiKey = function(key) {
          $http.defaults.headers.common['Authorization'] = 
            'Basic:api:' + key;
      }; 
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
      Authenticator.requestResetPassword = function(email) {
        var url = 'api/requestresetpassword/'+email;
        var promise = $http({
          url: url,
          method: 'GET'
        });
        return promise;
      };
      Authenticator.resetPassword = function(key, password) {
        var url = 'api/resetpassword';
        var promise = $http({
          url: url,
          method: 'POST',
          data: {
            key: key,
            password: password
          }
        });
        return promise;
      };
      return Authenticator;
    }
  );

})();
