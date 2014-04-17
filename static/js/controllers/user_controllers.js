(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.user',
    [
    ]);
  
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
