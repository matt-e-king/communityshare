(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.authentication',
    [
      'communityshare.services.authentication',
    ]);
  
  module.controller(
    'LoginController',
    function($scope, $location, Authenticator) {
      $scope.email = undefined;
      $scope.password = undefined;
      $scope.login = function() {
        var userPromise = Authenticator.authenticateWithEmailAndPassword(
          $scope.email, $scope.password);
        userPromise.then(function(data) {
          $location.path("/home")
        });
      }
      Authenticator.authenticateWithEmailAndPassword('ben@reynwar.net', 'viewable');
    });

  module.controller(
    'NavigationController',
    function($scope, Session) {
      $scope.Session = Session;
    });
  
  module.controller(
    'DropdownCtrl',
    function($scope) {
      $scope.items = [
        "Find Project",
        "Create Project",
        "Update Project"
      ];
    });

})();
