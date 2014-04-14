(function() {
  
  var module = angular.module(
    'partmaster.services.authentication',
    [])
  
  module.factory(
    'Authenticator',
    function($q) {
      var Authenticator = {};
      Authenticator.prototype.authenticateWithPassword =
        // FIXME: Dummy authentication.
        function(email, password) {
          var deferred = $q.defer();
          deferred.resolve({username: 'Bob'});
          return deferred.promise;
        }
    }
  );

})();
