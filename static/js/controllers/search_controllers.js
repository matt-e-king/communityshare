(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.search',
    [
      'communityshare.services.user',
      'communityshare.services.search'
    ]);
  
  module.controller(
    'SignupEducatorController',
    function($scope, $location, $q, Session, User, Search) {
      $scope.Session = Session;
      $scope.activeLabels = {};
      $scope.newUser = new User();
      $scope.message = '';
      $scope.getLabels = function() {
        var labels = [];
        for (var label in $scope.activeLabels) {
          if ($scope.activeLabels[label]) {
            labels.push(label);
          }
        }
      };
      $scope.saveSettings = function() {
        var userPromise = $scope.newUser.save();
        var searchPromise = userPromise.then(
          function(user) {
            var newSearch = new Search({
              searcher_user_id: user.id,
              searcher_role: 'educator',
              searching_for_role: 'partner',
              active_only: false,
              labels: $scope.getLabels()
            });
            return newSearch.save();
          },
          function(message) {
            var deferred = $q.defer();
            deferred.reject('Failed to signup: ' + message);
            return deferred.promise;
          });
        searchPromise.then(
          function(search) {
            console.log('search is - ' + search);
            $location.path('#/home');
          },
          function(message) {
            $scope.message =
              "Failed to save preferences: " + message;
          }
        );
      };
    });

})();
