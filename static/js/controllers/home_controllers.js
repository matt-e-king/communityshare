(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.home',
    [
      'communityshare.directives.home'
    ]);
  
  module.controller(
    'HomeController',
    function($scope, Session) {
      $scope.Session = Session;
    });

  module.controller(
    'EducatorHomeController',
    function($scope, Session, Search) {
      if (Session.activeUser) {
        var searchParams = {
          'searcher_user_id': Session.activeUser.id
        };
        var searchesPromise = Search.get_many(searchParams);
        searchesPromise.then(
          function(searches) {
            console.log('searches are');
            console.log(searches);
            $scope.activeSearches = [];
            for (var i=0; i<searches.length; i++) {
              var search = searches[i];
              if (!search.active_only) {
                $scope.activeSearches.push(search);
              }
            }
            console.log($scope.activeSearches);
          },
          function() {
          });
      }
      
    });

  module.controller(
    'CommunityPartnerHomeController',
    function() {
    });

  module.controller(
    'AdministratorHomeController',
    function($scope, $location) {
      $scope.searchText = '';
      $scope.searchForUsers = function() {
        var searchParams = {
          'searchText': $scope.searchText
        };
        $location.path('/searchusers').search(searchParams);
      };
    });

    module.controller(
    'SearchesDisplayController',
    function() {
    });

  module.controller(
    'SearchUsersController',
    function($scope, $location, $q, User, Session) {
      $scope.Session = Session;
      $scope.message = 'Searching for matching users...';
      $scope.users = undefined;
      $scope.searchText = $location.search().searchText;
      var searchForUsers = function() {
        var searchNameParams = {
          'name.ilike': '%' + $scope.searchText + '%'
        };
        var searchEmailParams = {
          'email.ilike': '%' + $scope.searchText + '%'
        };
        var byNamePromise = User.get_many(searchNameParams);
        var byEmailPromise = User.get_many(searchEmailParams);
        var combinedPromise = $q.all({byName: byNamePromise,
                                      byEmail: byEmailPromise});

        combinedPromise.then(
          function(results) {
            var users = results.byName.concat(results.byEmail);
            $scope.users = users;
            $scope.message = '';
          },
          function(message) {
            $scope.message = 'Failed to load users';
            if (message) {
              $scope.message + ': ' + message;
            }
          });
      }
      searchForUsers();
      $scope.newSearch = function() {
        var searchParams = {
          'searchText': $scope.searchText
        };
        $location.search(searchParams);
      };
    });

})();
