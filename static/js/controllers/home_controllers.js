(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.home',
    [
      'communityshare.directives.home',
      'communityshare.services.search'
    ]);
  
  module.controller(
    'HomeController',
    function($scope, Session) {
      $scope.Session = Session;
    });

  module.controller(
    'EducatorHomeController',
    function($scope, Session, Search) {
      if ((Session.activeUser) && (Session.activeUser.is_educator)) {
        var searchParams = {
          'searcher_user_id': Session.activeUser.id
        };
        var searchesPromise = Search.get_many(searchParams);
        searchesPromise.then(
          function(searches) {
            $scope.activeSearches = [];
            for (var i=0; i<searches.length; i++) {
              var search = searches[i];
              if (search.active) {
                $scope.activeSearches.push(search);
              }
            }
          },
          function() {
          });
      }
      
    });

  module.controller(
    'CommunityPartnerHomeController',
    function($scope, Session, Search, Messages, CommunityPartnerUtils) {
      $scope.properties = {};
      if (Session.activeUser) {
        var searchesPromise = Session.activeUser.getSearches();
        var searchPromise = CommunityPartnerUtils.searchesPromiseToSearchPromise(
          searchesPromise);
        searchPromise.then(
          function(search) {
            $scope.search = search;
            search.makeLabelDisplay();
          }, 
          function(message) {
            Messages.error(message);
          });
      }
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
