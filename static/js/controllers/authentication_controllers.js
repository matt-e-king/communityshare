(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.authentication',
    [
      'communityshare.services.authentication',
    ]);
  
  module.controller(
    'ResetPasswordController',
    function($scope, Authenticator, $routeParams, $location) {
      var key = $routeParams.key;
      $location.search('key', null);
      $scope.password = '';
      $scope.passwordRepeat = '';
      $scope.successfulReset = false;
      $scope.failedReset = false;
      $scope.resetPassword = function() {
        var promise = Authenticator.resetPassword(key, $scope.password);
        promise.then(
          function() {
            $location.path('/login').search({});
            $scope.successfulReset = true;
          },
          function() {
            $scope.failedReset = true;
          });
      };
    });

  module.controller(
    'RequestResetPasswordController',
    function($scope, Authenticator) {
      $scope.email = '';
      $scope.successfulRequest = false;
      $scope.failedRequest = false;
      $scope.requestResetPassword = function() {
        var promise = Authenticator.requestResetPassword($scope.email);
        promise.then(
          function() {
            $scope.successfulRequest = true;
          },
          function() {
            $scope.failedRequest = true;
          });
      };
    });

  module.controller(
    'LogoutController',
    function(Authenticator, Session) {
      Authenticator.clean();
      Session.activeUser = undefined;
    });

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
