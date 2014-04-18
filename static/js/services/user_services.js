(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.user',
    [
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

})();
