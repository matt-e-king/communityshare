(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.user',
    [
      'communityshare.services.user'
    ]);
  
  module.controller(
    'UserController',
    function($scope, $routeParams, User, Session) {
      $scope.Session = Session;
      var userId = $routeParams.userId;
      var userPromise = User.get(userId);
      $scope.message = 'Loading user...'
      userPromise.then(
        function(user) {
          $scope.message = '';
          $scope.user = user;
        },
        function(response) {
          $scope.message = 'Could not find user with id=' + userId;
        });
    });

  module.controller(
    'SettingsController',
    function($scope, Session) {
      $scope.Session = Session;
      if (Session.activeUser) {
        $scope.editedUser = Session.activeUser.clone();
      }
      $scope.saveSettings = function() {
        var savePromise = $scope.editedUser.save();
        savePromise.then(
          function(user) {
            Session.activeUser.updateFromData(user.toData());
          },
          function(response) {
            console.log('failed to save user');
          });
      };
    });

})();
