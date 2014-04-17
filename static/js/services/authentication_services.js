(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.authentication',
    [
      'ngResource',
      'communityshare.services.item'
    ])

  var isEmail = function(email) {
    // from http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };

  module.factory(
    'User',
    function(ItemFactory, $q, $http) {
      var User = ItemFactory('user');
      User.getByEmail = function(email) {
        var deferred = $q.defer();
        var dataPromise = $http({
          method: 'GET',
          url: '/api/userbyemail/' + email
        });
        dataPromise.then(
          function(data) {
            var user = new User(data.data.data);
            deferred.resolve(user);
          },
          function(response) {
            deferred.reject(response.message);
          }
        );
        return deferred.promise;
      };
      return User;
    });

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
