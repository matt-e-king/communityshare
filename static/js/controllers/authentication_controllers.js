(function() {
  'use strict';

  var module = angular.module('communityshare.controllers.authentication', []);
  
  module.controller(
    'LoginController',
    function($scope, Authenticator) {
      $scope.email = undefined;
      $scope.password = undefined;
      $scope.login = function() {
        var userPromise = Authenticator.authenticateWithPassword(email, password);
      }
    });
  
})();
