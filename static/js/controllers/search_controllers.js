(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.search',
    [
    ]);

  module.controller(
    'SearchEditController',
    function(Session, $location, $scope, $routeParams, Search, Messages) {
      var searchId = $routeParams.searchId;
      var searchPromise = Search.get(searchId);
      $scope.searchSettingsMethods = {};
      searchPromise.then(
        function(search) {
          if ($scope.searchSettingsMethods.setSearch) {
            $scope.searchSettingsMethods.setSearch(search);
          }
        },
        function(message) {
          Messages.showError(message);
        });
      var goToUserView = function(userId) {
        if (Session.activeUser.id === userId) {
          $location.path('/home');
        }else {
          $location.path('/user/' + userId);
        }
      };
      $scope.saveSettings = function() {
          if ($scope.searchSettingsMethods.saveSettings) {
            var promise = $scope.searchSettingsMethods.saveSettings();
            promise.then(
              function(search) {
                goToUserView(search.searcher_user_id);
              },
              function(message) {
                Messages.showError(message);
              });
          }
        
      };
    });
  
})();
