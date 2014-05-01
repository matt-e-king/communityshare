(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.search',
    [
    ]);

  module.controller(
    'SearchResultsController',
    function($scope, $routeParams, Search, Messages) {
      var searchId = $routeParams.searchId;
      if (searchId !== undefined) {
        var searchesPromise = Search.getResults(searchId);
        searchesPromise.then(
          function(searches) {
            $scope.searches = searches;
          },
          function(message) {
            Messages.error(message);
          });
      }
    });

  module.controller(
    'SearchEditController',
    function(Session, $location, $scope, $routeParams, Search, Messages) {
      $scope.searchSettingsMethods = {};
      $scope.properties = {};
      var searchId = $routeParams.searchId;
      if (searchId !== undefined) {
        var searchPromise = Search.get(searchId);
        searchPromise.then(
          function(search) {
            if ($scope.searchSettingsMethods.setSearch) {
              $scope.searchSettingsMethods.setSearch(search);
            }
          },
          function(message) {
            Messages.error(message);
          });
      } else {
        var searcher_role;
        var searching_for_role;
        if (Session.activeUser.is_educator) {
          searcher_role = 'educator';
          searching_for_role = 'partner';
        } else {
          searcher_role = 'partner';
          searching_for_role = 'educator';
        }
        var search = new Search({
          searcher_user_id: Session.activeUser.id,
          searcher_role: searcher_role,
          searching_for_role: searching_for_role
        });
        $scope.search = search;
      }

      $scope.saveSettings = function() {
          if ($scope.searchSettingsMethods.saveSettings) {
            var promise = $scope.searchSettingsMethods.saveSettings();
            promise.then(
              function(search) {
                $location.path('/search/' + search.id + '/results');
              },
              function(message) {
                Messages.error(message);
              });
          }
        
      };
    });
  
})();
